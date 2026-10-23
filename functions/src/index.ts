import { createHash, randomUUID } from 'crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type DocumentSnapshot, type Query } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { ageOn, denialKey, isAtLeast18 } from './ageGate';
import { decidePhoneSignIn, IP_SIGN_IN_LIMITS, PHONE_SIGN_IN_LIMITS, type PhoneLimitState } from './phoneSignInLimit';
import { moderateImage, moderateText } from './geminiService';
import {
  isProfilePhotoId,
  keywordProfileText,
  legacyPhotos,
  normalizeProfileText,
  photoUploadIssue,
  profileAfterTextReview,
  profileTextChanged,
  projectPublicPhotos,
  removePhoto,
  reorderPhotos,
  upsertPhoto,
  type ProfilePhotoRecord,
  type PublicProfileShape,
} from './profileEdit';
import { LiveIapVerifier, StubIapVerifier, iapStubMode, mintStubReceipt, type IapReceipt } from './iap';
import { createKycVendor, stubKycCompletionAllowed, stubsAllowed } from './kycVendor';
import { createPayoutProvider } from './payoutProvider';

initializeApp();

const db = getFirestore();
const authAdmin = getAuth();
const REGION = 'australia-southeast1';
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const MIN_PRICE_CENTS = 100;
const MAX_PRICE_CENTS = 20000;
const MIN_PAYOUT_CENTS = 1000;
const CREATOR_SHARE_BPS = 7000;
const DELETED = 'deleted-user';

const callable = { region: REGION };
const moderated = { region: REGION, secrets: [GEMINI_API_KEY] };
const enforceAppCheck = process.env.ENFORCE_APP_CHECK === 'true';
const PRIVATE_PROFILE_KEYS = ['dateOfBirth', 'phone', 'email', 'role', 'provider', 'dob'] as const;

function uidOf(request: CallableRequest): string {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in required.');
  return request.auth.uid;
}

function payload(request: CallableRequest): Record<string, unknown> {
  if (!request.data || typeof request.data !== 'object') return {};
  return request.data as Record<string, unknown>;
}

function textField(source: Record<string, unknown>, key: string, max: number): string {
  const value = source[key];
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${key} is required.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new HttpsError('invalid-argument', `${key} is invalid.`);
  return trimmed;
}

function optionalText(source: Record<string, unknown>, key: string, max: number): string {
  const value = source[key];
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${key} is invalid.`);
  }
  return value.trim();
}

function phoneOf(request: CallableRequest): string | null {
  const token = request.auth?.token as { phone_number?: string } | undefined;
  return typeof token?.phone_number === 'string' ? token.phone_number : null;
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function cleanPhoto(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^https:\/\/\S{1,500}$/i.test(value)) {
    throw new HttpsError('invalid-argument', 'Photo URL must be https.');
  }
  return value;
}

function assertPaidPrice(cents: number): void {
  if (!Number.isInteger(cents) || cents < MIN_PRICE_CENTS || cents > MAX_PRICE_CENTS) {
    throw new HttpsError('invalid-argument', 'Price is outside the allowed range.');
  }
}

async function denialIds(uid: string, phone: string | null): Promise<string[]> {
  const keys = [await denialKey(`uid:${uid}`)];
  if (phone) keys.push(await denialKey(phone));
  return keys;
}

async function isDenied(uid: string, phone: string | null): Promise<boolean> {
  const keys = await denialIds(uid, phone);
  const snaps = await Promise.all(keys.map((key) => db.doc(`ageDenials/${key}`).get()));
  return snaps.some((snap) => snap.exists);
}

async function assertAdmin(uid: string): Promise<void> {
  const snap = await db.doc(`users/${uid}`).get();
  if (snap.get('role') !== 'admin') throw new HttpsError('permission-denied', 'Admin only.');
}

async function hidden(uid: string, other: string): Promise<boolean> {
  const snap = await db.doc(`blockEdges/${uid}/hidden/${other}`).get();
  return snap.exists;
}

async function deleteQuery(ref: Query): Promise<void> {
  const snap = await ref.get();
  await Promise.all(snap.docs.map((item) => item.ref.delete()));
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function limitState(snap: DocumentSnapshot): PhoneLimitState {
  const raw = snap.get('attempts');
  const attempts = Array.isArray(raw) ? raw.filter((item): item is number => typeof item === 'number') : [];
  return { attempts, lastSentAt: attempts.length > 0 ? Math.max(...attempts) : null };
}

function clientIp(request: CallableRequest): string | null {
  const raw = request.rawRequest as { ip?: string; headers?: Record<string, string | string[] | undefined> } | undefined;
  if (!raw) return null;
  const forwarded = raw.headers?.['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof value === 'string' && value.trim()) return value.split(',')[0]!.trim();
  return raw.ip ?? null;
}

/**
 * Reserve a phone-auth SMS before the client calls Firebase Auth.
 * Unauthenticated on purpose: the user does not have a session yet.
 * Counts are stored under a hash. The phone number itself is not written.
 */
export const reservePhoneSignIn = onCall({ region: REGION, enforceAppCheck }, async (request) => {
  const phone = textField(payload(request), 'phone', 20);
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new HttpsError('invalid-argument', 'Invalid phone number.');
  const now = Date.now();
  const phoneRef = db.doc(`phoneSignInLimits/phone_${sha256(phone)}`);
  const ip = clientIp(request);
  const ipRef = ip ? db.doc(`phoneSignInLimits/ip_${sha256(ip)}`) : null;
  const decision = await db.runTransaction(async (tx) => {
    const phoneSnap = await tx.get(phoneRef);
    const phoneDecision = decidePhoneSignIn(limitState(phoneSnap), now, PHONE_SIGN_IN_LIMITS);
    if (!phoneDecision.allowed || !phoneDecision.next) return phoneDecision;
    if (ipRef) {
      const ipSnap = await tx.get(ipRef);
      const ipDecision = decidePhoneSignIn(limitState(ipSnap), now, IP_SIGN_IN_LIMITS);
      if (!ipDecision.allowed || !ipDecision.next) return ipDecision;
      tx.set(ipRef, { attempts: ipDecision.next.attempts });
    }
    tx.set(phoneRef, { attempts: phoneDecision.next.attempts });
    return phoneDecision;
  });
  if (!decision.allowed) throw new HttpsError('resource-exhausted', String(decision.retryAfterSeconds));
  return { allowed: true };
});

export const getAgeGateStatus = onCall(callable, async (request) => {
  const uid = uidOf(request);
  return { denied: await isDenied(uid, phoneOf(request)) };
});

export const rejectUnderage = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const dob = textField(payload(request), 'dateOfBirth', 10);
  if (isAtLeast18(dob)) throw new HttpsError('failed-precondition', 'This date of birth is 18 or older.');
  const keys = await denialIds(uid, phoneOf(request));
  const now = new Date().toISOString();
  await Promise.all(keys.map((key) => db.doc(`ageDenials/${key}`).set({ createdAt: now, reason: 'under_18' })));
  await db.doc(`users/${uid}`).delete().catch(() => undefined);
  await db.doc(`profiles/${uid}`).delete().catch(() => undefined);
  await authAdmin.deleteUser(uid).catch(() => undefined);
  return { blocked: true };
});

export const completeOnboarding = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const data = payload(request);
  const existing = await db.doc(`users/${uid}`).get();
  if (existing.get('onboardingComplete') === true) {
    throw new HttpsError('already-exists', 'Onboarding is already complete.');
  }
  const dateOfBirth = textField(data, 'dateOfBirth', 10);
  if ((await isDenied(uid, phoneOf(request))) || !isAtLeast18(dateOfBirth)) {
    const keys = await denialIds(uid, phoneOf(request));
    const now = new Date().toISOString();
    await Promise.all(keys.map((key) => db.doc(`ageDenials/${key}`).set({ createdAt: now, reason: 'under_18' })));
    await authAdmin.deleteUser(uid).catch(() => undefined);
    throw new HttpsError('permission-denied', 'You must be 18 or older.');
  }
  if (data.acceptedTerms !== true) throw new HttpsError('failed-precondition', 'Terms must be accepted.');
  const age = ageOn(dateOfBirth);
  if (age === null) throw new HttpsError('invalid-argument', 'Date of birth is invalid.');
  const displayName = textField(data, 'displayName', 40);
  const city = textField(data, 'city', 40);
  const bio = textField(data, 'bio', 500);
  const gender = textField(data, 'gender', 20);
  if (!['woman', 'man', 'nonbinary', 'unspecified'].includes(gender)) {
    throw new HttpsError('invalid-argument', 'Gender is invalid.');
  }
  const interests = Array.isArray(data.interests) ? data.interests.filter((item) => typeof item === 'string').slice(0, 8) : [];
  const locale = data.locale === 'zh-CN' ? 'zh-CN' : 'en';
  const now = new Date().toISOString();
  const providerId = request.auth?.token.firebase?.sign_in_provider ?? 'phone';
  const provider = providerId.includes('apple') ? 'apple' : providerId.includes('google') ? 'google' : 'phone';
  const user = {
    uid,
    role: 'user',
    phone: phoneOf(request),
    provider,
    dateOfBirth,
    displayName,
    createdAt: existing.get('createdAt') ?? now,
    onboardingComplete: true,
    locale,
  };
  const profile = {
    uid,
    displayName,
    age,
    gender,
    bio,
    city,
    distanceKm: null,
    interests,
    photoUrl: cleanPhoto(data.photoUrl),
  };
  for (const key of PRIVATE_PROFILE_KEYS) {
    if (key in profile) throw new HttpsError('internal', 'Public profile cannot store private account fields.');
  }
  await db.doc(`users/${uid}`).set(user);
  await db.doc(`profiles/${uid}`).set(profile);
  return { user };
});

export const likeUser = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const toUserId = textField(payload(request), 'toUserId', 128);
  if (toUserId === uid) throw new HttpsError('invalid-argument', 'You cannot like your own profile.');
  if ((await hidden(uid, toUserId)) || (await hidden(toUserId, uid))) {
    throw new HttpsError('failed-precondition', 'This person is blocked.');
  }
  const target = await db.doc(`profiles/${toUserId}`).get();
  if (!target.exists) throw new HttpsError('not-found', 'Profile not found.');
  const now = new Date().toISOString();
  const likeId = `${uid}_${toUserId}`;
  const reciprocalId = `${toUserId}_${uid}`;
  let matched = false;
  let matchId: string | undefined;
  let chatId: string | undefined;
  await db.runTransaction(async (tx) => {
    const reverse = await tx.get(db.doc(`likes/${reciprocalId}`));
    const [a, b] = sortedPair(uid, toUserId);
    const nextMatchId = `match_${a}_${b}`;
    const nextChatId = `chat_${a}_${b}`;
    const matchSnap = await tx.get(db.doc(`matches/${nextMatchId}`));
    const chatSnap = await tx.get(db.doc(`chats/${nextChatId}`));
    tx.set(db.doc(`likes/${likeId}`), { id: likeId, fromUserId: uid, toUserId, createdAt: now });
    tx.set(db.doc(`swipes/${likeId}`), { fromUserId: uid, toUserId, createdAt: now });
    if (!reverse.exists) return;
    matched = true;
    matchId = nextMatchId;
    chatId = nextChatId;
    if (!matchSnap.exists) {
      tx.set(db.doc(`matches/${nextMatchId}`), { id: nextMatchId, userIds: [a, b], createdAt: now, chatId: nextChatId });
    }
    if (!chatSnap.exists) {
      tx.set(db.doc(`chats/${nextChatId}`), {
        id: nextChatId,
        participantIds: [a, b],
        createdAt: now,
        lastMessageText: null,
        lastMessageAt: null,
      });
    }
  });
  return { matched, matchId, chatId };
});

export const sendMessage = onCall(moderated, async (request) => {
  const uid = uidOf(request);
  const data = payload(request);
  const chatId = textField(data, 'chatId', 200);
  const text = textField(data, 'text', 2000);
  const chat = await db.doc(`chats/${chatId}`).get();
  const participants = (chat.get('participantIds') as string[] | undefined) ?? [];
  if (!participants.includes(uid)) throw new HttpsError('permission-denied', 'Chat not found.');
  const other = participants[0] === uid ? participants[1] : participants[0];
  if (!other || (await hidden(uid, other))) throw new HttpsError('failed-precondition', 'This person is blocked.');
  let verdict;
  try {
    verdict = await moderateText(GEMINI_API_KEY.value(), text, 'chat');
  } catch (error) {
    throw new HttpsError('failed-precondition', error instanceof Error ? error.message : 'Moderation failed.');
  }
  if (!verdict.allowed) throw new HttpsError('failed-precondition', verdict.reason || 'Message was not allowed.');
  const now = new Date().toISOString();
  const message = { id: `msg_${crypto.randomUUID()}`, chatId, senderId: uid, text, createdAt: now };
  await db.collection(`chats/${chatId}/messages`).doc(message.id).set(message);
  await db.doc(`chats/${chatId}`).update({ lastMessageText: text, lastMessageAt: now });
  return { message };
});

export const blockUser = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const userId = textField(payload(request), 'userId', 128);
  if (userId === uid) throw new HttpsError('invalid-argument', 'You cannot block yourself.');
  const now = new Date().toISOString();
  const block = { id: `${uid}_${userId}`, blockerId: uid, blockedId: userId, createdAt: now };
  await db.doc(`blocks/${block.id}`).set(block);
  await db.doc(`blockEdges/${uid}/hidden/${userId}`).set({ initiatedBy: uid, createdAt: now });
  await db.doc(`blockEdges/${userId}/hidden/${uid}`).set({ initiatedBy: uid, createdAt: now });
  return { ok: true };
});

export const unblockUser = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const userId = textField(payload(request), 'userId', 128);
  const edge = await db.doc(`blockEdges/${uid}/hidden/${userId}`).get();
  if (edge.get('initiatedBy') !== uid) throw new HttpsError('permission-denied', 'Only the person who blocked can undo it.');
  await db.doc(`blocks/${uid}_${userId}`).delete();
  await db.doc(`blockEdges/${uid}/hidden/${userId}`).delete();
  await db.doc(`blockEdges/${userId}/hidden/${uid}`).delete();
  return { ok: true };
});

export const submitCreatorProfile = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const data = payload(request);
  const user = await db.doc(`users/${uid}`).get();
  const dob = String(user.get('dateOfBirth') ?? '');
  if (!user.get('onboardingComplete') || !isAtLeast18(dob)) {
    throw new HttpsError('permission-denied', 'Creators must be 18 or older.');
  }
  if (data.tosAccepted !== true || data.adultConfirmed !== true) {
    throw new HttpsError('failed-precondition', 'Confirm the creator terms and that you are 18 or older.');
  }
  const price = data.subscriptionPriceCents;
  if (typeof price !== 'number') throw new HttpsError('invalid-argument', 'Subscription price is required.');
  assertPaidPrice(price);
  const existing = await db.doc(`creators/${uid}`).get();
  const now = new Date().toISOString();
  const creator = {
    uid,
    displayName: String(user.get('displayName') ?? ''),
    bio: textField(data, 'bio', 500),
    photoUrl: cleanPhoto((await db.doc(`profiles/${uid}`).get()).get('photoUrl')),
    kycStatus: existing.get('kycStatus') ?? 'none',
    kycProvider: existing.get('kycProvider') ?? null,
    subscriptionPriceCents: price,
    currency: 'AUD',
    tosAcceptedAt: now,
    adultConfirmedAt: now,
  };
  await db.doc(`creators/${uid}`).set(creator);
  return { creator };
});

export const startKyc = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const creator = await db.doc(`creators/${uid}`).get();
  if (!creator.get('tosAcceptedAt') || !creator.get('adultConfirmedAt')) {
    throw new HttpsError('failed-precondition', 'Accept the creator terms first.');
  }
  const vendor = createKycVendor();
  const now = new Date().toISOString();
  const created = await vendor.createSession({ userId: uid, reference: `${uid}-${Date.now()}` });
  const session = {
    id: created.sessionId,
    userId: uid,
    provider: vendor.name,
    status: 'pending',
    redirectUrl: created.redirectUrl,
    createdAt: now,
  };
  await db.doc(`kycSessions/${session.id}`).set(session);
  await db.doc(`creators/${uid}`).update({ kycStatus: 'pending', kycProvider: vendor.name });
  return { session };
});

export const completeStubKyc = onCall(callable, async (request) => {
  if (!stubKycCompletionAllowed()) {
    throw new HttpsError('failed-precondition', 'Identity checks are in live mode. The stub cannot complete them.');
  }
  const uid = uidOf(request);
  const result = payload(request).result === 'rejected' ? 'rejected' : 'verified';
  const creatorRef = db.doc(`creators/${uid}`);
  const creator = await creatorRef.get();
  if (!creator.exists) throw new HttpsError('failed-precondition', 'Start creator onboarding first.');
  await creatorRef.update({ kycStatus: result });
  return { creator: { ...creator.data(), uid, kycStatus: result } };
});

export const submitCreatorPost = onCall(moderated, async (request) => {
  const uid = uidOf(request);
  const data = payload(request);
  const creator = await db.doc(`creators/${uid}`).get();
  if (creator.get('kycStatus') !== 'verified') {
    throw new HttpsError('failed-precondition', 'Identity check must be verified before posting.');
  }
  const title = textField(data, 'title', 80);
  const body = textField(data, 'body', 2000);
  const isPaid = data.isPaid === true;
  const priceCents = isPaid ? data.priceCents : 0;
  if (typeof priceCents !== 'number') throw new HttpsError('invalid-argument', 'Price is invalid.');
  if (isPaid) assertPaidPrice(priceCents);
  else if (priceCents !== 0) throw new HttpsError('invalid-argument', 'Free posts cannot have a price.');
  let verdict;
  try {
    verdict = await moderateText(GEMINI_API_KEY.value(), `${title}\n${body}`, 'creator_post');
  } catch (error) {
    throw new HttpsError('failed-precondition', error instanceof Error ? error.message : 'Moderation failed.');
  }
  const now = new Date().toISOString();
  const post = {
    id: `post_${crypto.randomUUID()}`,
    creatorId: uid,
    title,
    body,
    isPaid,
    priceCents: isPaid ? priceCents : 0,
    currency: 'AUD',
    reviewStatus: verdict.allowed ? 'pending' : 'rejected',
    reviewNote: verdict.allowed ? null : verdict.reason,
    createdAt: now,
  };
  await db.doc(`creatorPosts/${post.id}`).set(post);
  return { post };
});

export const verifyPurchase = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const data = payload(request);
  const kind = data.kind === 'post' ? 'post' : data.kind === 'subscription' ? 'subscription' : null;
  const platform = data.platform === 'google' ? 'google' : data.platform === 'apple' ? 'apple' : null;
  const productId = textField(data, 'productId', 200);
  if (!kind || !platform) throw new HttpsError('invalid-argument', 'Purchase is invalid.');
  let creatorId = '';
  let amountCents = 0;
  if (kind === 'subscription') {
    const creator = await db.doc(`creators/${productId}`).get();
    if (creator.get('kycStatus') !== 'verified') throw new HttpsError('not-found', 'Creator not found.');
    creatorId = productId;
    amountCents = Number(creator.get('subscriptionPriceCents'));
  } else {
    const post = await db.doc(`creatorPosts/${productId}`).get();
    if (post.get('reviewStatus') !== 'approved' || post.get('isPaid') !== true) {
      throw new HttpsError('not-found', 'Post not found.');
    }
    creatorId = String(post.get('creatorId'));
    amountCents = Number(post.get('priceCents'));
  }
  if (creatorId === uid) throw new HttpsError('failed-precondition', 'You cannot buy your own content.');
  if ((await hidden(uid, creatorId)) || (await hidden(creatorId, uid))) {
    throw new HttpsError('failed-precondition', 'This creator is unavailable.');
  }
  assertPaidPrice(amountCents);
  const entitlementId = `${uid}_${kind}_${productId}`;
  const existing = await db.doc(`entitlements/${entitlementId}`).get();
  if (existing.exists) throw new HttpsError('already-exists', 'Already purchased.');
  // The client must send the store receipt. The server never mints one in live mode.
  let verified: { transactionId: string };
  try {
    if (iapStubMode(stubsAllowed())) {
      verified = await new StubIapVerifier().verify(mintStubReceipt(platform, productId));
    } else {
      const token = typeof data.receipt === 'string' ? data.receipt : '';
      if (!token) throw new Error('A store receipt is required.');
      const receipt: IapReceipt = { platform, productId, token };
      verified = await new LiveIapVerifier().verify(receipt);
    }
  } catch (error) {
    throw new HttpsError('failed-precondition', error instanceof Error ? error.message : 'Purchase could not be verified.');
  }
  const dupe = await db.collection('purchases').where('providerTransactionId', '==', verified.transactionId).limit(1).get();
  if (!dupe.empty) throw new HttpsError('already-exists', 'This receipt was already used.');
  const now = new Date().toISOString();
  const purchase = {
    id: `purchase_${verified.transactionId}`,
    userId: uid,
    creatorId,
    kind,
    productId,
    amountCents,
    currency: 'AUD',
    platform,
    providerTransactionId: verified.transactionId,
    status: 'completed',
    createdAt: now,
  };
  const credit = Math.floor((amountCents * CREATOR_SHARE_BPS) / 10000);
  await db.doc(`purchases/${purchase.id}`).set(purchase);
  await db.doc(`entitlements/${entitlementId}`).set({
    id: entitlementId,
    userId: uid,
    creatorId,
    kind,
    productId,
    active: true,
    createdAt: now,
  });
  await db.doc(`balances/${creatorId}`).set(
    {
      uid: creatorId,
      availableCents: FieldValue.increment(credit),
      pendingCents: FieldValue.increment(0),
      currency: 'AUD',
    },
    { merge: true },
  );
  return { purchase };
});

export const requestPayout = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const amountCents = payload(request).amountCents;
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < MIN_PAYOUT_CENTS) {
    throw new HttpsError('invalid-argument', 'Minimum payout is A$10.00.');
  }
  const creator = await db.doc(`creators/${uid}`).get();
  if (creator.get('kycStatus') !== 'verified') {
    throw new HttpsError('failed-precondition', 'Payouts require a verified identity check.');
  }
  const provider = createPayoutProvider();
  const now = new Date().toISOString();
  const payoutId = `payout_${crypto.randomUUID()}`;
  const payoutRef = db.doc(`payouts/${payoutId}`);
  const balanceRef = db.doc(`balances/${uid}`);
  // 1. Deduct and lock the amount before any money moves.
  await db.runTransaction(async (tx) => {
    const balance = await tx.get(balanceRef);
    const available = Number(balance.get('availableCents') ?? 0);
    if (available < amountCents) throw new HttpsError('failed-precondition', 'Balance is too low.');
    tx.update(balanceRef, {
      availableCents: available - amountCents,
      lockedCents: FieldValue.increment(amountCents),
    });
    tx.set(payoutRef, {
      id: payoutId,
      creatorId: uid,
      amountCents,
      currency: 'AUD',
      provider: provider.name,
      providerTransferId: null,
      status: 'locked',
      createdAt: now,
    });
  });
  // 2. Call the provider. On failure, release the lock back to available.
  let transfer: { transferId: string; status: 'pending' };
  try {
    transfer = await provider.createTransfer({ creatorId: uid, amountCents, currency: 'AUD' });
  } catch (error) {
    await db.runTransaction(async (tx) => {
      tx.update(balanceRef, {
        availableCents: FieldValue.increment(amountCents),
        lockedCents: FieldValue.increment(-amountCents),
      });
      tx.update(payoutRef, { status: 'failed' });
    });
    throw new HttpsError('unavailable', error instanceof Error ? error.message : 'Payout failed.');
  }
  // Locked funds stay locked until the provider webhook confirms (TODO: webhook handler).
  await payoutRef.update({ providerTransferId: transfer.transferId, status: transfer.status });
  const payout = {
    id: payoutId,
    creatorId: uid,
    amountCents,
    currency: 'AUD' as const,
    provider: provider.name,
    providerTransferId: transfer.transferId,
    status: transfer.status,
    createdAt: now,
  };
  return { payout };
});

export const reviewReport = onCall(callable, async (request) => {
  const uid = uidOf(request);
  await assertAdmin(uid);
  const data = payload(request);
  const id = textField(data, 'id', 200);
  const status = textField(data, 'status', 20);
  if (!['reviewing', 'resolved', 'dismissed'].includes(status)) {
    throw new HttpsError('invalid-argument', 'Choose a review status.');
  }
  const note = optionalText(data, 'note', 500);
  await db.doc(`reports/${id}`).update({
    status,
    adminNote: note,
    resolvedAt: new Date().toISOString(),
  });
  return { ok: true };
});

export const reviewCreatorPost = onCall(callable, async (request) => {
  const uid = uidOf(request);
  await assertAdmin(uid);
  const data = payload(request);
  const id = textField(data, 'id', 200);
  const status = textField(data, 'status', 20);
  if (status !== 'approved' && status !== 'rejected') {
    throw new HttpsError('invalid-argument', 'Choose approved or rejected.');
  }
  await db.doc(`creatorPosts/${id}`).update({
    reviewStatus: status,
    reviewNote: optionalText(data, 'note', 500) || null,
  });
  return { ok: true };
});

export const exportAccountData = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'Account not found.');
  const profileSnap = await db.doc(`profiles/${uid}`).get();
  const creatorSnap = await db.doc(`creators/${uid}`).get();
  const [posts, likesFrom, likesTo, matches, chats, blocksFrom, blocksTo, reports, purchases, payouts] = await Promise.all([
    db.collection('creatorPosts').where('creatorId', '==', uid).get(),
    db.collection('likes').where('fromUserId', '==', uid).get(),
    db.collection('likes').where('toUserId', '==', uid).get(),
    db.collection('matches').where('userIds', 'array-contains', uid).get(),
    db.collection('chats').where('participantIds', 'array-contains', uid).get(),
    db.collection('blocks').where('blockerId', '==', uid).get(),
    db.collection('blocks').where('blockedId', '==', uid).get(),
    db.collection('reports').where('reporterId', '==', uid).get(),
    db.collection('purchases').where('userId', '==', uid).get(),
    db.collection('payouts').where('creatorId', '==', uid).get(),
  ]);
  const messages = (
    await Promise.all(
      chats.docs.map(async (chat) => {
        const thread = await db.collection(`chats/${chat.id}/messages`).orderBy('createdAt', 'asc').get();
        return thread.docs.map((item) => item.data());
      }),
    )
  ).flat();
  return {
    export: {
      exportedAt: new Date().toISOString(),
      user: userSnap.data(),
      profile: profileSnap.exists ? profileSnap.data() : null,
      creator: creatorSnap.exists ? creatorSnap.data() : null,
      posts: posts.docs.map((item) => item.data()),
      likes: [...likesFrom.docs, ...likesTo.docs].map((item) => item.data()),
      matches: matches.docs.map((item) => item.data()),
      messages,
      blocks: [...blocksFrom.docs, ...blocksTo.docs].map((item) => item.data()),
      reportsFiled: reports.docs.map((item) => item.data()),
      purchases: purchases.docs.map((item) => item.data()),
      payouts: payouts.docs.map((item) => item.data()),
    },
  };
});

const photoCallable = { region: REGION, secrets: [GEMINI_API_KEY], memory: '512MiB' as const, timeoutSeconds: 60 };

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asPhotos(value: unknown): ProfilePhotoRecord[] | null {
  if (!Array.isArray(value)) return null;
  const photos: ProfilePhotoRecord[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const photo = item as Partial<ProfilePhotoRecord>;
    if (typeof photo.id !== 'string') continue;
    const status = photo.status === 'approved' || photo.status === 'rejected' || photo.status === 'pending' ? photo.status : 'pending';
    photos.push({
      id: photo.id,
      storagePath: typeof photo.storagePath === 'string' ? photo.storagePath : '',
      status,
      reason: typeof photo.reason === 'string' ? photo.reason : null,
      publicUrl: typeof photo.publicUrl === 'string' ? photo.publicUrl : null,
    });
  }
  return photos;
}

function profileShape(uid: string, data: Record<string, unknown> | undefined): PublicProfileShape {
  return {
    uid,
    displayName: String(data?.displayName ?? ''),
    age: typeof data?.age === 'number' ? data.age : 0,
    gender: String(data?.gender ?? 'unspecified'),
    bio: String(data?.bio ?? ''),
    city: String(data?.city ?? ''),
    distanceKm: typeof data?.distanceKm === 'number' ? data.distanceKm : null,
    interests: asStringArray(data?.interests),
    photoUrl: typeof data?.photoUrl === 'string' ? data.photoUrl : null,
    photoUrls: asStringArray(data?.photoUrls),
    ...(data?.verified === true ? { verified: true } : {}),
    ...(typeof data?.job === 'string' && data.job ? { job: data.job } : {}),
  };
}

function profileWrite(profile: PublicProfileShape): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    uid: profile.uid,
    displayName: profile.displayName,
    age: profile.age,
    gender: profile.gender,
    bio: profile.bio,
    city: profile.city,
    distanceKm: profile.distanceKm,
    interests: profile.interests,
    photoUrl: profile.photoUrl,
    photoUrls: profile.photoUrls,
    job: profile.job ? profile.job : FieldValue.delete(),
  };
  if (profile.verified) payload.verified = true;
  for (const key of PRIVATE_PROFILE_KEYS) {
    if (key in payload) throw new HttpsError('internal', 'Public profile cannot store private account fields.');
  }
  return payload;
}

async function loadGallery(uid: string, profile: PublicProfileShape): Promise<ProfilePhotoRecord[]> {
  const user = await db.doc(`users/${uid}`).get();
  const stored = asPhotos(user.get('profilePhotos'));
  if (stored && stored.length > 0) return stored;
  const urls = profile.photoUrls.length > 0 ? profile.photoUrls : profile.photoUrl ? [profile.photoUrl] : [];
  return legacyPhotos(urls);
}

async function saveGallery(uid: string, photos: ProfilePhotoRecord[], profile: PublicProfileShape): Promise<PublicProfileShape> {
  const next = projectPublicPhotos(profile, photos);
  await db.doc(`users/${uid}`).set({ profilePhotos: photos }, { merge: true });
  await db.doc(`profiles/${uid}`).set(profileWrite(next), { merge: true });
  return next;
}

function editorFrom(profile: PublicProfileShape, photos: ProfilePhotoRecord[], review: Record<string, unknown> | null) {
  const status = review?.status;
  const textStatus = status === 'approved' || status === 'rejected' || status === 'pending' ? status : 'none';
  const draft = review?.draft;
  return {
    profile,
    photos,
    textStatus,
    textReason: typeof review?.reason === 'string' ? review.reason : null,
    textCategories: asStringArray(review?.categories),
    textDraft: draft && typeof draft === 'object' ? draft : null,
  };
}

export const submitProfileText = onCall(moderated, async (request) => {
  const uid = uidOf(request);
  const userSnap = await db.doc(`users/${uid}`).get();
  if (userSnap.get('onboardingComplete') !== true) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
  const data = payload(request);
  const parsed = normalizeProfileText({
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    bio: typeof data.bio === 'string' ? data.bio : '',
    job: typeof data.job === 'string' ? data.job : '',
    city: typeof data.city === 'string' ? data.city : '',
    interests: asStringArray(data.interests),
  });
  if (!parsed.ok) throw new HttpsError('invalid-argument', parsed.field);
  const profileSnap = await db.doc(`profiles/${uid}`).get();
  if (!profileSnap.exists) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
  const current = profileShape(uid, profileSnap.data());
  const photos = await loadGallery(uid, current);
  if (!profileTextChanged(current, parsed.value)) {
    return {
      status: 'approved' as const,
      reason: '',
      categories: [] as string[],
      profile: current,
      editor: editorFrom(current, photos, null),
    };
  }
  const keyword = keywordProfileText(parsed.value);
  let verdict = keyword;
  if (keyword.allowed) {
    try {
      const labeled = [
        `Name: ${parsed.value.displayName}`,
        `Bio: ${parsed.value.bio}`,
        parsed.value.job ? `Job: ${parsed.value.job}` : '',
        `Interests: ${parsed.value.interests.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n');
      verdict = await moderateText(GEMINI_API_KEY.value(), labeled, 'profile');
    } catch {
      throw new HttpsError('failed-precondition', 'moderation-unavailable');
    }
  }
  const published = profileAfterTextReview(current, parsed.value, verdict.allowed);
  const review = {
    status: verdict.allowed ? 'approved' : 'rejected',
    reason: verdict.allowed ? '' : verdict.reason,
    categories: verdict.categories,
    draft: verdict.allowed ? null : parsed.value,
    updatedAt: new Date().toISOString(),
  };
  if (verdict.allowed) {
    await db.doc(`profiles/${uid}`).set(profileWrite(published), { merge: true });
    await db.doc(`users/${uid}`).set({ displayName: parsed.value.displayName, profileTextReview: review }, { merge: true });
  } else {
    await db.doc(`users/${uid}`).set({ profileTextReview: review }, { merge: true });
  }
  return {
    status: verdict.allowed ? ('approved' as const) : ('rejected' as const),
    reason: verdict.allowed ? '' : verdict.reason,
    categories: verdict.categories,
    profile: published,
    editor: editorFrom(published, photos, review),
  };
});

export const registerProfilePhoto = onCall(photoCallable, async (request) => {
  const uid = uidOf(request);
  const userSnap = await db.doc(`users/${uid}`).get();
  if (userSnap.get('onboardingComplete') !== true) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
  const photoId = textField(payload(request), 'photoId', 80);
  if (!isProfilePhotoId(photoId) || photoId.startsWith('legacy-')) {
    throw new HttpsError('invalid-argument', 'photoId');
  }
  const profileSnap = await db.doc(`profiles/${uid}`).get();
  if (!profileSnap.exists) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
  let profile = profileShape(uid, profileSnap.data());
  let photos = await loadGallery(uid, profile);
  const path = `users/${uid}/photos/${photoId}`;
  const pending: ProfilePhotoRecord = {
    id: photoId,
    storagePath: path,
    status: 'pending',
    reason: null,
    publicUrl: null,
  };
  const withPending = upsertPhoto(photos, pending);
  if (!withPending) throw new HttpsError('failed-precondition', 'photos');
  photos = withPending;
  await db.doc(`users/${uid}`).set({ profilePhotos: photos }, { merge: true });

  const file = getStorage().bucket().file(path);
  const [exists] = await file.exists();
  if (!exists) throw new HttpsError('not-found', 'Photo upload was not found.');
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size ?? 0);
  const contentType = String(metadata.contentType ?? '');
  const issue = photoUploadIssue(contentType, size);
  if (issue) {
    const rejected: ProfilePhotoRecord = { ...pending, status: 'rejected', reason: issue };
    photos = upsertPhoto(photos, rejected) ?? photos;
    profile = await saveGallery(uid, photos, profile);
    return { photo: rejected, editor: editorFrom(profile, photos, null) };
  }
  let buffer: Buffer;
  try {
    [buffer] = await file.download();
  } catch {
    throw new HttpsError('not-found', 'Photo upload was not found.');
  }
  let verdict;
  try {
    verdict = await moderateImage(GEMINI_API_KEY.value(), buffer, contentType);
  } catch {
    throw new HttpsError('failed-precondition', 'moderation-unavailable');
  }
  if (!verdict.allowed) {
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: '' } }).catch(() => undefined);
    const rejected: ProfilePhotoRecord = { ...pending, status: 'rejected', reason: verdict.reason || 'rejected' };
    photos = upsertPhoto(photos, rejected) ?? photos;
    profile = await saveGallery(uid, photos, profile);
    return { photo: rejected, editor: editorFrom(profile, photos, null), status: 'rejected' as const };
  }
  const token = randomUUID();
  await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  const encoded = encodeURIComponent(path);
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${getStorage().bucket().name}/o/${encoded}?alt=media&token=${token}`;
  const approved: ProfilePhotoRecord = { ...pending, status: 'approved', publicUrl };
  photos = upsertPhoto(photos, approved) ?? photos;
  profile = await saveGallery(uid, photos, profile);
  return { photo: approved, editor: editorFrom(profile, photos, null), status: 'approved' as const };
});

export const reorderProfilePhotos = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const ids = asStringArray(payload(request).photoIds);
  const profileSnap = await db.doc(`profiles/${uid}`).get();
  if (!profileSnap.exists) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
  let profile = profileShape(uid, profileSnap.data());
  const photos = await loadGallery(uid, profile);
  const next = reorderPhotos(photos, ids);
  if (!next) throw new HttpsError('invalid-argument', 'photoIds');
  profile = await saveGallery(uid, next, profile);
  return { editor: editorFrom(profile, next, null) };
});

export const deleteProfilePhoto = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const photoId = textField(payload(request), 'photoId', 80);
  const profileSnap = await db.doc(`profiles/${uid}`).get();
  if (!profileSnap.exists) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
  let profile = profileShape(uid, profileSnap.data());
  const photos = await loadGallery(uid, profile);
  const next = removePhoto(photos, photoId);
  if (!next) throw new HttpsError('not-found', 'Photo not found.');
  const removed = photos.find((photo) => photo.id === photoId);
  if (removed?.storagePath.startsWith(`users/${uid}/photos/`)) {
    await getStorage().bucket().file(removed.storagePath).delete({ ignoreNotFound: true }).catch(() => undefined);
  }
  profile = await saveGallery(uid, next, profile);
  return { editor: editorFrom(profile, next, null) };
});

export const deleteAccount = onCall(callable, async (request) => {
  const uid = uidOf(request);
  const chats = await db.collection('chats').where('participantIds', 'array-contains', uid).get();
  await Promise.all(
    chats.docs.map(async (chat) => {
      const messages = await db.collection(`chats/${chat.id}/messages`).listDocuments();
      await Promise.all(messages.map((item) => item.delete()));
      await chat.ref.delete();
    }),
  );
  const hiddenEdges = await db.collection(`blockEdges/${uid}/hidden`).get();
  await Promise.all(
    hiddenEdges.docs.map(async (edge) => {
      await db.doc(`blockEdges/${edge.id}/hidden/${uid}`).delete().catch(() => undefined);
      await edge.ref.delete();
    }),
  );
  await Promise.all([
    db.doc(`users/${uid}`).delete(),
    db.doc(`profiles/${uid}`).delete(),
    db.doc(`creators/${uid}`).delete(),
    db.doc(`balances/${uid}`).delete(),
    deleteQuery(db.collection('creatorPosts').where('creatorId', '==', uid)),
    deleteQuery(db.collection('likes').where('fromUserId', '==', uid)),
    deleteQuery(db.collection('likes').where('toUserId', '==', uid)),
    deleteQuery(db.collection('passes').where('fromUserId', '==', uid)),
    deleteQuery(db.collection('swipes').where('fromUserId', '==', uid)),
    deleteQuery(db.collection('matches').where('userIds', 'array-contains', uid)),
    deleteQuery(db.collection('blocks').where('blockerId', '==', uid)),
    deleteQuery(db.collection('blocks').where('blockedId', '==', uid)),
    deleteQuery(db.collection('entitlements').where('userId', '==', uid)),
    deleteQuery(db.collection('kycSessions').where('userId', '==', uid)),
    deleteQuery(db.collection('payouts').where('creatorId', '==', uid)),
  ]);
  const [reports, purchases] = await Promise.all([
    db.collection('reports').where('reporterId', '==', uid).get(),
    db.collection('purchases').where('userId', '==', uid).get(),
  ]);
  await Promise.all([
    ...reports.docs.map((item) => item.ref.update({ reporterId: DELETED })),
    ...purchases.docs.map((item) => item.ref.update({ userId: DELETED })),
  ]);
  await getStorage()
    .bucket()
    .deleteFiles({ prefix: `users/${uid}/photos/` })
    .catch(() => undefined);
  await authAdmin.deleteUser(uid).catch(() => undefined);
  return { ok: true };
});
