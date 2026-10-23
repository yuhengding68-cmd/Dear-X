import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  getAuth,
  getRedirectResult,
  signInWithCredential,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  AuthSession,
  Balance,
  Block,
  Chat,
  Creator,
  CreatorPost,
  CreatorStartInput,
  DataExport,
  DatingProfile,
  Entitlement,
  FirebaseWebConfig,
  KycSession,
  Match,
  Message,
  OnboardingInput,
  PostInput,
  PrivateUser,
  Purchase,
  PurchaseInput,
  Report,
  ReportInput,
  ReportStatus,
} from '../types';
import { firebaseErrorCode, mapFirebaseAuthCode, retryAfterSeconds } from '../domain/authErrors';
import { ensureAppCheck } from './appCheck';
import { RepoError } from './errors';
import { loadIosNativeAuth } from './nativeAuth';
import type { LikeOutcome, PhoneStart, Repository } from './repository';

const REGION = 'australia-southeast1';

function asError(error: unknown, code: string): RepoError {
  if (error instanceof RepoError) return error;
  const message = error instanceof Error ? error.message : 'Request failed';
  return new RepoError(code, message.replace(/^Firebase:\s*/i, ''));
}

function authFailure(error: unknown): RepoError {
  if (error instanceof RepoError) return error;
  const mapped = mapFirebaseAuthCode(firebaseErrorCode(error));
  if (mapped === 'too-many-requests') {
    return new RepoError('too-many-requests', String(retryAfterSeconds(error) ?? 30));
  }
  return new RepoError(mapped, mapped);
}

function sessionFromUser(user: User, placeholderAuth: boolean): AuthSession {
  const providerId = user.providerData[0]?.providerId ?? 'phone';
  const provider = providerId.includes('apple') ? 'apple' : providerId.includes('google') ? 'google' : 'phone';
  return {
    uid: user.uid,
    phone: user.phoneNumber,
    provider,
    placeholderAuth,
  };
}

export function createFirebaseRepository(config: FirebaseWebConfig): Repository {
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, REGION);
  let confirmation: ConfirmationResult | null = null;
  let verifier: RecaptchaVerifier | null = null;
  let nativeVerificationId: string | null = null;
  let redirectChecked = false;

  const resetVerifier = async () => {
    try {
      verifier?.clear();
    } catch {
      /* The widget can already be gone after a failed attempt. */
    }
    verifier = null;
  };

  const rememberRedirectError = (error: unknown) => {
    if (typeof sessionStorage === 'undefined') return;
    const mapped = error instanceof RepoError ? error.code : mapFirebaseAuthCode(firebaseErrorCode(error));
    if (mapped === 'cancelled') return;
    sessionStorage.setItem('dearx.authError', mapped);
  };

  const assertNotAgeDenied = async () => {
    try {
      const gate = await call<Record<string, never>, { denied: boolean }>('getAgeGateStatus')({});
      if (gate.data.denied) {
        await signOut(auth);
        throw new RepoError('underage', 'underage');
      }
    } catch (error) {
      if (error instanceof RepoError) throw error;
      await signOut(auth).catch(() => undefined);
      throw new RepoError('auth-unavailable', 'auth-unavailable');
    }
  };

  const call = <Req, Res>(name: string) => httpsCallable<Req, Res>(functions, name);

  const currentUid = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new RepoError('signed-out', 'Sign in required.');
    return uid;
  };

  const hiddenIds = async (uid: string) => {
    const snap = await getDocs(collection(db, 'blockEdges', uid, 'hidden'));
    return new Set(snap.docs.map((item) => item.id));
  };

  return {
    mode: 'firebase',
    async getSession() {
      await auth.authStateReady();
      if (!redirectChecked) {
        redirectChecked = true;
        try {
          await getRedirectResult(auth);
        } catch (error) {
          rememberRedirectError(error);
        }
      }
      return auth.currentUser ? sessionFromUser(auth.currentUser, false) : null;
    },
    async beginPhoneSignIn(e164) {
      try {
        await ensureAppCheck(app);
        await call<{ phone: string }, { allowed: boolean }>('reservePhoneSignIn')({ phone: e164 });
        const native = await loadIosNativeAuth();
        if (native) {
          const started = await native.signInWithPhoneNumber({ phoneNumber: e164 });
          if (!started.verificationId) throw new RepoError('captcha', 'captcha');
          nativeVerificationId = started.verificationId;
          confirmation = null;
          return { status: 'code-sent', session: null } satisfies PhoneStart;
        }
        if (!verifier) {
          verifier = new RecaptchaVerifier(auth, 'dearx-recaptcha', { size: 'invisible' });
        }
        confirmation = await signInWithPhoneNumber(auth, e164, verifier);
        return { status: 'code-sent', session: null } satisfies PhoneStart;
      } catch (error) {
        await resetVerifier();
        nativeVerificationId = null;
        throw authFailure(error);
      }
    },
    async confirmPhoneCode(code) {
      try {
        await ensureAppCheck(app);
        if (nativeVerificationId) {
          const credential = PhoneAuthProvider.credential(nativeVerificationId, code);
          const cred = await signInWithCredential(auth, credential);
          nativeVerificationId = null;
          await assertNotAgeDenied();
          return sessionFromUser(cred.user, false);
        }
        if (!confirmation) throw new RepoError('code-expired', 'code-expired');
        const cred = await confirmation.confirm(code);
        confirmation = null;
        await assertNotAgeDenied();
        return sessionFromUser(cred.user, false);
      } catch (error) {
        throw authFailure(error);
      }
    },
    async signInWithProvider(provider) {
      try {
        await ensureAppCheck(app);
        const native = await loadIosNativeAuth();
        if (native) {
          if (provider === 'apple') {
            const result = await native.signInWithApple();
            const oauth = new OAuthProvider('apple.com');
            const idToken = result.credential?.idToken;
            if (!idToken) throw new RepoError('internal', 'internal');
            const credential = oauth.credential({ idToken, rawNonce: result.credential?.nonce });
            const cred = await signInWithCredential(auth, credential);
            await assertNotAgeDenied();
            return sessionFromUser(cred.user, false);
          }
          const result = await native.signInWithGoogle();
          const idToken = result.credential?.idToken;
          if (!idToken) throw new RepoError('internal', 'internal');
          const credential = GoogleAuthProvider.credential(idToken, result.credential?.accessToken);
          const cred = await signInWithCredential(auth, credential);
          await assertNotAgeDenied();
          return sessionFromUser(cred.user, false);
        }
        const oauth = provider === 'apple' ? new OAuthProvider('apple.com') : new GoogleAuthProvider();
        if (provider === 'apple') {
          oauth.addScope('email');
          oauth.addScope('name');
        } else {
          oauth.setCustomParameters({ prompt: 'select_account' });
        }
        try {
          const cred = await signInWithPopup(auth, oauth);
          await assertNotAgeDenied();
          return sessionFromUser(cred.user, false);
        } catch (error) {
          if (mapFirebaseAuthCode(firebaseErrorCode(error)) !== 'popup-blocked') throw error;
          await signInWithRedirect(auth, oauth);
          throw new RepoError('popup-blocked', 'popup-blocked');
        }
      } catch (error) {
        throw authFailure(error);
      }
    },
    async signOut() {
      await signOut(auth);
    },
    async getAgeGateDenied() {
      await auth.authStateReady();
      if (!auth.currentUser) return false;
      const gate = await call<Record<string, never>, { denied: boolean }>('getAgeGateStatus')({});
      return gate.data.denied;
    },
    async rejectUnderage(dateOfBirth) {
      try {
        await call<{ dateOfBirth: string }, { blocked: boolean }>('rejectUnderage')({ dateOfBirth });
      } finally {
        await signOut(auth).catch(() => undefined);
      }
    },
    async getMe() {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) return null;
      const snap = await getDoc(doc(db, 'users', user.uid));
      return snap.exists() ? (snap.data() as PrivateUser) : null;
    },
    async getMyProfile() {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) return null;
      const snap = await getDoc(doc(db, 'profiles', user.uid));
      return snap.exists() ? (snap.data() as DatingProfile) : null;
    },
    async completeOnboarding(input) {
      try {
        const result = await call<OnboardingInput, { user: PrivateUser }>('completeOnboarding')(input);
        return result.data.user;
      } catch (error) {
        throw asError(error, 'onboarding');
      }
    },
    async getDiscovery() {
      const uid = currentUid();
      const [profiles, blocks, passes, swipes, matches] = await Promise.all([
        getDocs(collection(db, 'profiles')),
        hiddenIds(uid),
        getDocs(query(collection(db, 'passes'), where('fromUserId', '==', uid))),
        getDocs(query(collection(db, 'swipes'), where('fromUserId', '==', uid))),
        getDocs(query(collection(db, 'matches'), where('userIds', 'array-contains', uid))),
      ]);
      const skip = new Set<string>([uid, ...blocks]);
      passes.docs.forEach((item) => skip.add(String(item.data().toUserId)));
      swipes.docs.forEach((item) => skip.add(String(item.data().toUserId)));
      matches.docs.forEach((item) => {
        const ids = item.data().userIds as string[];
        ids.forEach((id) => skip.add(id));
      });
      return profiles.docs
        .map((item) => item.data() as DatingProfile)
        .filter((profile) => profile.uid && !skip.has(profile.uid));
    },
    async likeUser(toUserId) {
      try {
        const result = await call<{ toUserId: string }, LikeOutcome>('likeUser')({ toUserId });
        return result.data;
      } catch (error) {
        throw asError(error, 'like');
      }
    },
    async passUser(toUserId) {
      const uid = currentUid();
      await setDoc(doc(db, 'passes', `${uid}_${toUserId}`), {
        fromUserId: uid,
        toUserId,
        createdAt: new Date().toISOString(),
      });
    },
    async getMatches() {
      const uid = currentUid();
      const [matchSnap, blocks] = await Promise.all([
        getDocs(query(collection(db, 'matches'), where('userIds', 'array-contains', uid))),
        hiddenIds(uid),
      ]);
      const rows = await Promise.all(
        matchSnap.docs.map(async (item) => {
          const match = item.data() as Match;
          const other = match.userIds[0] === uid ? match.userIds[1] : match.userIds[0];
          if (blocks.has(other)) return null;
          const profileSnap = await getDoc(doc(db, 'profiles', other));
          return { match, profile: profileSnap.exists() ? (profileSnap.data() as DatingProfile) : null };
        }),
      );
      return rows.filter((row): row is { match: Match; profile: DatingProfile | null } => row !== null);
    },
    async getChats() {
      const uid = currentUid();
      const [chatSnap, blocks] = await Promise.all([
        getDocs(query(collection(db, 'chats'), where('participantIds', 'array-contains', uid))),
        hiddenIds(uid),
      ]);
      const rows = await Promise.all(
        chatSnap.docs.map(async (item) => {
          const chat = item.data() as Chat;
          const other = chat.participantIds[0] === uid ? chat.participantIds[1] : chat.participantIds[0];
          if (blocks.has(other)) return null;
          const profileSnap = await getDoc(doc(db, 'profiles', other));
          return { chat, profile: profileSnap.exists() ? (profileSnap.data() as DatingProfile) : null };
        }),
      );
      return rows.filter((row): row is { chat: Chat; profile: DatingProfile | null } => row !== null);
    },
    async getMessages(chatId) {
      const uid = currentUid();
      const chatSnap = await getDoc(doc(db, 'chats', chatId));
      if (!chatSnap.exists()) return [];
      const chat = chatSnap.data() as Chat;
      if (!chat.participantIds.includes(uid)) return [];
      const other = chat.participantIds[0] === uid ? chat.participantIds[1] : chat.participantIds[0];
      if ((await hiddenIds(uid)).has(other)) return [];
      const snap = await getDocs(query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')));
      return snap.docs.map((item) => item.data() as Message);
    },
    async sendMessage(chatId, text) {
      try {
        const result = await call<{ chatId: string; text: string }, { message: Message }>('sendMessage')({ chatId, text });
        return result.data.message;
      } catch (error) {
        throw asError(error, 'moderation');
      }
    },
    async fileReport(input: ReportInput) {
      const uid = currentUid();
      const ref = await addDoc(collection(db, 'reports'), {
        reporterId: uid,
        targetUserId: input.targetUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      return { id: ref.id, reporterId: uid, ...input, status: 'open', createdAt: new Date().toISOString() };
    },
    async blockUser(userId) {
      try {
        await call<{ userId: string }, { ok: boolean }>('blockUser')({ userId });
      } catch (error) {
        throw asError(error, 'block');
      }
    },
    async unblockUser(userId) {
      try {
        await call<{ userId: string }, { ok: boolean }>('unblockUser')({ userId });
      } catch (error) {
        throw asError(error, 'block');
      }
    },
    async listBlocks() {
      const uid = currentUid();
      const snap = await getDocs(collection(db, 'blockEdges', uid, 'hidden'));
      const rows = await Promise.all(
        snap.docs.map(async (item) => {
          const data = item.data() as { initiatedBy?: string };
          if (data.initiatedBy && data.initiatedBy !== uid) {
            const profileSnap = await getDoc(doc(db, 'profiles', item.id));
            return {
              block: {
                id: `${uid}_${item.id}`,
                blockerId: data.initiatedBy,
                blockedId: item.id,
                createdAt: '',
              } satisfies Block,
              profile: profileSnap.exists() ? (profileSnap.data() as DatingProfile) : null,
              mine: false,
            };
          }
          const profileSnap = await getDoc(doc(db, 'profiles', item.id));
          return {
            block: { id: `${uid}_${item.id}`, blockerId: uid, blockedId: item.id, createdAt: '' } satisfies Block,
            profile: profileSnap.exists() ? (profileSnap.data() as DatingProfile) : null,
            mine: true,
          };
        }),
      );
      return rows.filter((row) => row.mine).map(({ block, profile }) => ({ block, profile }));
    },
    async listCreators() {
      const uid = currentUid();
      const [snap, blocks] = await Promise.all([
        getDocs(query(collection(db, 'creators'), where('kycStatus', '==', 'verified'))),
        hiddenIds(uid),
      ]);
      return snap.docs
        .map((item) => item.data() as Creator)
        .filter((creator) => creator.uid !== uid && !blocks.has(creator.uid));
    },
    async getCreatorPage(id) {
      const uid = currentUid();
      if ((await hiddenIds(uid)).has(id)) return null;
      const creatorSnap = await getDoc(doc(db, 'creators', id));
      if (!creatorSnap.exists()) return null;
      const creator = creatorSnap.data() as Creator;
      if (creator.kycStatus !== 'verified') return null;
      const posts = await getDocs(
        query(collection(db, 'creatorPosts'), where('creatorId', '==', id), where('reviewStatus', '==', 'approved')),
      );
      return { creator, posts: posts.docs.map((item) => item.data() as CreatorPost) };
    },
    async getMyCreator() {
      const snap = await getDoc(doc(db, 'creators', currentUid()));
      return snap.exists() ? (snap.data() as Creator) : null;
    },
    async listMyPosts() {
      const snap = await getDocs(query(collection(db, 'creatorPosts'), where('creatorId', '==', currentUid())));
      return snap.docs.map((item) => item.data() as CreatorPost);
    },
    async myEntitlements() {
      const snap = await getDocs(query(collection(db, 'entitlements'), where('userId', '==', currentUid())));
      return snap.docs.map((item) => item.data() as Entitlement).filter((item) => item.active);
    },
    async startCreatorProfile(input: CreatorStartInput) {
      try {
        const result = await call<CreatorStartInput, { creator: Creator }>('submitCreatorProfile')(input);
        return result.data.creator;
      } catch (error) {
        throw asError(error, 'creator');
      }
    },
    async startKyc() {
      try {
        const result = await call<Record<string, never>, { session: KycSession }>('startKyc')({});
        return result.data.session;
      } catch (error) {
        throw asError(error, 'kyc');
      }
    },
    async completeStubKyc(result) {
      try {
        const response = await call<{ result: 'verified' | 'rejected' }, { creator: Creator }>('completeStubKyc')({ result });
        return response.data.creator;
      } catch (error) {
        throw asError(error, 'kyc');
      }
    },
    async createPost(input: PostInput) {
      try {
        const result = await call<PostInput, { post: CreatorPost }>('submitCreatorPost')(input);
        return result.data.post;
      } catch (error) {
        throw asError(error, 'post');
      }
    },
    async purchase(input: PurchaseInput) {
      try {
        const result = await call<PurchaseInput, { purchase: Purchase }>('verifyPurchase')(input);
        return result.data.purchase;
      } catch (error) {
        throw asError(error, 'purchase');
      }
    },
    async getBalance() {
      const snap = await getDoc(doc(db, 'balances', currentUid()));
      return snap.exists() ? (snap.data() as Balance) : null;
    },
    async requestPayout(amountCents) {
      try {
        const result = await call<{ amountCents: number }, { payout: import('../types').Payout }>('requestPayout')({
          amountCents,
        });
        return result.data.payout;
      } catch (error) {
        throw asError(error, 'payout');
      }
    },
    async exportData() {
      try {
        const result = await call<Record<string, never>, { export: DataExport }>('exportAccountData')({});
        return result.data.export;
      } catch (error) {
        throw asError(error, 'export');
      }
    },
    async deleteAccount() {
      try {
        await call<Record<string, never>, { ok: boolean }>('deleteAccount')({});
      } catch (error) {
        throw asError(error, 'delete');
      } finally {
        await signOut(auth).catch(() => undefined);
      }
    },
    async listReportsForAdmin() {
      const snap = await getDocs(collection(db, 'reports'));
      return snap.docs
        .map((item) => ({ id: item.id, ...(item.data() as Omit<Report, 'id'>) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async reviewReport(id: string, status: ReportStatus, note: string) {
      try {
        await call<{ id: string; status: ReportStatus; note: string }, { ok: boolean }>('reviewReport')({ id, status, note });
      } catch (error) {
        throw asError(error, 'forbidden');
      }
    },
    async listPendingPostsForAdmin() {
      const snap = await getDocs(query(collection(db, 'creatorPosts'), where('reviewStatus', '==', 'pending')));
      return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<CreatorPost, 'id'>) }));
    },
    async reviewPost(id, status, note) {
      try {
        await call<{ id: string; status: 'approved' | 'rejected'; note: string }, { ok: boolean }>('reviewCreatorPost')({
          id,
          status,
          note,
        });
      } catch (error) {
        throw asError(error, 'forbidden');
      }
    },
    async resetDemo() {
      throw new RepoError('demo-only', 'Reset is only available in demo mode.');
    },
  };
}
