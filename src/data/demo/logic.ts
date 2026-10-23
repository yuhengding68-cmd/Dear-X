import { ageOn, isAtLeast18 } from '../../domain/age';
import { assertPrice, planPurchase } from '../../domain/commerce';
import { applyLike, blockedSet, isBlockedPair } from '../../domain/matching';
import { moderateWithKeywordStub } from '../../domain/moderation';
import {
  isProfilePhotoId,
  legacyPhotos,
  moderateProfileText,
  normalizeProfileText,
  photoContentVerdict,
  photoUploadIssue,
  profileAfterTextReview,
  profileTextChanged,
  projectPublicPhotos,
  removePhoto,
  reorderPhotos,
  settlePhotoModeration,
  upsertPhoto,
  type NewProfilePhoto,
  type ProfileEditResult,
  type ProfileEditor,
  type ProfileEditorDraft,
  type ProfilePhotoRecord,
  type ProfileTextInput,
} from '../../domain/profileEdit';
import type {
  Balance,
  Block,
  Chat,
  Creator,
  CreatorPost,
  CreatorStartInput,
  DataExport,
  DatingProfile,
  KycProviderName,
  Message,
  OnboardingInput,
  Pass,
  PostInput,
  PrivateUser,
  Report,
  ReportInput,
} from '../../types';
import type { DemoState } from './state';

const DELETED = 'deleted-user';

export function visibleProfiles(state: DemoState, uid: string): DatingProfile[] {
  const blocked = blockedSet(state.blocks, uid);
  const skip = new Set<string>([uid]);
  for (const like of state.likes) if (like.fromUserId === uid) skip.add(like.toUserId);
  for (const pass of state.passes) if (pass.fromUserId === uid) skip.add(pass.toUserId);
  for (const match of state.matches) {
    if (match.userIds.includes(uid)) {
      skip.add(match.userIds[0] === uid ? match.userIds[1] : match.userIds[0]);
    }
  }
  const onboarded = new Set(state.users.filter((user) => user.onboardingComplete && user.role !== 'admin').map((user) => user.uid));
  return state.profiles.filter((profile) => onboarded.has(profile.uid) && !skip.has(profile.uid) && !blocked.has(profile.uid));
}

export function visibleCreators(state: DemoState, uid: string) {
  const blocked = blockedSet(state.blocks, uid);
  return state.creators.filter((creator) => creator.uid !== uid && creator.kycStatus === 'verified' && !blocked.has(creator.uid));
}

export function visibleChats(state: DemoState, uid: string): Chat[] {
  const blocked = blockedSet(state.blocks, uid);
  return state.chats.filter(
    (chat) => chat.participantIds.includes(uid) && !chat.participantIds.some((id) => id !== uid && blocked.has(id)),
  );
}

export function profileFor(state: DemoState, uid: string): DatingProfile | null {
  return state.profiles.find((profile) => profile.uid === uid) ?? null;
}

export function requireUser(state: DemoState, uid: string): PrivateUser {
  const user = state.users.find((item) => item.uid === uid);
  if (!user) throw new Error('Account not found.');
  return user;
}

export function completeOnboarding(state: DemoState, uid: string, input: OnboardingInput, now: string): DemoState {
  const user = requireUser(state, uid);
  if (user.onboardingComplete) throw new Error('Onboarding is already complete.');
  if (!input.acceptedTerms) throw new Error('Terms must be accepted.');
  if (!isAtLeast18(input.dateOfBirth, new Date(now))) throw new Error('You must be 18 or older.');
  const name = input.displayName.trim();
  if (name.length < 2) throw new Error('Name is too short.');
  if (!input.city.trim() || !input.bio.trim()) throw new Error('City and bio are required.');
  const age = ageOn(input.dateOfBirth, new Date(now));
  if (age === null) throw new Error('Date of birth is invalid.');
  const nextUser: PrivateUser = {
    ...user,
    dateOfBirth: input.dateOfBirth,
    displayName: name,
    onboardingComplete: true,
    locale: input.locale,
  };
  const profile: DatingProfile = {
    uid,
    displayName: name,
    age,
    gender: input.gender,
    bio: input.bio.trim(),
    city: input.city,
    distanceKm: null,
    interests: input.interests,
    photoUrl: input.photoUrl,
  };
  return {
    ...state,
    users: state.users.map((item) => (item.uid === uid ? nextUser : item)),
    profiles: [...state.profiles.filter((item) => item.uid !== uid), profile],
  };
}

export function like(state: DemoState, fromUserId: string, toUserId: string, now: string) {
  const result = applyLike(
    {
      likes: state.likes,
      matches: state.matches,
      chats: state.chats,
      blocks: state.blocks,
      messages: state.messages,
    },
    fromUserId,
    toUserId,
    now,
  );
  return {
    state: {
      ...state,
      likes: result.tables.likes,
      matches: result.tables.matches,
      chats: result.tables.chats,
      messages: result.tables.messages,
    },
    matched: result.matched,
    matchId: result.matchId,
    chatId: result.chatId,
  };
}

export function pass(state: DemoState, fromUserId: string, toUserId: string, now: string): DemoState {
  if (state.passes.some((item) => item.fromUserId === fromUserId && item.toUserId === toUserId)) return state;
  const entry: Pass = { id: `${fromUserId}_${toUserId}`, fromUserId, toUserId, createdAt: now };
  return { ...state, passes: [...state.passes, entry] };
}

export function sendMessage(state: DemoState, uid: string, chatId: string, text: string, now: string): { state: DemoState; message: Message } {
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat || !chat.participantIds.includes(uid)) throw new Error('Chat not found.');
  const other = chat.participantIds[0] === uid ? chat.participantIds[1] : chat.participantIds[0];
  if (isBlockedPair(state.blocks, uid, other)) throw new Error('This person is blocked.');
  const verdict = moderateWithKeywordStub(text);
  if (!verdict.allowed) throw new Error(verdict.reason);
  const message: Message = {
    id: `msg_${crypto.randomUUID()}`,
    chatId,
    senderId: uid,
    text: text.trim(),
    createdAt: now,
  };
  // Subcollection: messages are stored under the chat id.
  const thread = [...(state.messages[chatId] ?? []), message];
  return {
    message,
    state: {
      ...state,
      messages: { ...state.messages, [chatId]: thread },
      chats: state.chats.map((item) =>
        item.id === chatId ? { ...item, lastMessageText: message.text, lastMessageAt: now } : item,
      ),
    },
  };
}

export function fileReport(state: DemoState, reporterId: string, input: ReportInput, now: string): { state: DemoState; report: Report } {
  if (!input.reason.trim()) throw new Error('A reason is required.');
  const report: Report = {
    id: `report_${now}_${state.reports.length + 1}`,
    reporterId,
    targetUserId: input.targetUserId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason.trim(),
    details: input.details.trim(),
    status: 'open',
    createdAt: now,
  };
  return { report, state: { ...state, reports: [...state.reports, report] } };
}

export function block(state: DemoState, blockerId: string, blockedId: string, now: string): DemoState {
  if (blockerId === blockedId) throw new Error('You cannot block yourself.');
  if (state.blocks.some((item) => item.blockerId === blockerId && item.blockedId === blockedId)) return state;
  const entry: Block = { id: `${blockerId}_${blockedId}`, blockerId, blockedId, createdAt: now };
  return { ...state, blocks: [...state.blocks, entry] };
}

export function unblock(state: DemoState, blockerId: string, blockedId: string): DemoState {
  return { ...state, blocks: state.blocks.filter((item) => !(item.blockerId === blockerId && item.blockedId === blockedId)) };
}

export function startCreator(state: DemoState, uid: string, input: CreatorStartInput, now: string): DemoState {
  const user = requireUser(state, uid);
  if (!user.onboardingComplete || !user.dateOfBirth || !isAtLeast18(user.dateOfBirth, new Date(now))) {
    throw new Error('Creators must be 18 or older.');
  }
  if (!input.tosAccepted || !input.adultConfirmed) throw new Error('Confirm the creator terms and that you are 18 or older.');
  assertPrice(input.subscriptionPriceCents, true);
  const existing = state.creators.find((creator) => creator.uid === uid);
  const creator: Creator = {
    uid,
    displayName: user.displayName,
    bio: input.bio.trim(),
    photoUrl: profileFor(state, uid)?.photoUrl ?? null,
    kycStatus: existing?.kycStatus ?? 'none',
    kycProvider: existing?.kycProvider ?? null,
    subscriptionPriceCents: input.subscriptionPriceCents,
    currency: 'AUD',
    tosAcceptedAt: now,
    adultConfirmedAt: now,
  };
  const creators = existing ? state.creators.map((item) => (item.uid === uid ? creator : item)) : [...state.creators, creator];
  return { ...state, creators };
}

export function startKyc(state: DemoState, uid: string, provider: KycProviderName, now: string) {
  const creator = state.creators.find((item) => item.uid === uid);
  if (!creator?.tosAcceptedAt || !creator.adultConfirmedAt) throw new Error('Accept the creator terms first.');
  const session = {
    id: `kyc_${uid}_${now}`,
    userId: uid,
    provider,
    status: 'pending' as const,
    redirectUrl: `https://kyc.invalid/${provider}/session/${uid}`,
    createdAt: now,
  };
  return {
    session,
    state: {
      ...state,
      kycSessions: [...state.kycSessions, session],
      creators: state.creators.map((item) => (item.uid === uid ? { ...item, kycStatus: 'pending' as const, kycProvider: provider } : item)),
    },
  };
}

export function completeStubKyc(state: DemoState, uid: string, result: 'verified' | 'rejected'): DemoState {
  const creator = state.creators.find((item) => item.uid === uid);
  if (!creator) throw new Error('Start creator onboarding first.');
  return {
    ...state,
    creators: state.creators.map((item) => (item.uid === uid ? { ...item, kycStatus: result } : item)),
  };
}

export function createPost(state: DemoState, uid: string, input: PostInput, now: string): { state: DemoState; post: CreatorPost } {
  const creator = state.creators.find((item) => item.uid === uid);
  if (!creator || creator.kycStatus !== 'verified') throw new Error('Identity check must be verified before posting.');
  if (!input.title.trim() || !input.body.trim()) throw new Error('Title and body are required.');
  assertPrice(input.priceCents, input.isPaid);
  const verdict = moderateWithKeywordStub(`${input.title}\n${input.body}`);
  const post: CreatorPost = {
    id: `post_${now}_${state.posts.length + 1}`,
    creatorId: uid,
    title: input.title.trim(),
    body: input.body.trim(),
    isPaid: input.isPaid,
    priceCents: input.isPaid ? input.priceCents : 0,
    currency: 'AUD',
    reviewStatus: verdict.allowed ? 'pending' : 'rejected',
    reviewNote: verdict.allowed ? null : verdict.reason,
    createdAt: now,
  };
  return { post, state: { ...state, posts: [...state.posts, post] } };
}

export function purchase(state: DemoState, uid: string, kind: 'subscription' | 'post', productId: string, platform: 'apple' | 'google', token: string, now: string) {
  let creatorId = productId;
  let amount = 0;
  if (kind === 'subscription') {
    const creator = state.creators.find((item) => item.uid === productId && item.kycStatus === 'verified');
    if (!creator) throw new Error('Creator not found.');
    if (isBlockedPair(state.blocks, uid, creator.uid)) throw new Error('This creator is unavailable.');
    creatorId = creator.uid;
    amount = creator.subscriptionPriceCents;
  } else {
    const post = state.posts.find((item) => item.id === productId && item.reviewStatus === 'approved' && item.isPaid);
    if (!post) throw new Error('Post not found.');
    if (isBlockedPair(state.blocks, uid, post.creatorId)) throw new Error('This creator is unavailable.');
    creatorId = post.creatorId;
    amount = post.priceCents;
  }
  const alreadyOwned = state.entitlements.some((item) => item.userId === uid && item.kind === kind && item.productId === productId && item.active);
  const planned = planPurchase({
    userId: uid,
    creatorId,
    kind,
    productId,
    amountCents: amount,
    platform,
    token,
    now,
    alreadyOwned,
  });
  const balance: Balance = state.balances.find((item) => item.uid === creatorId) ?? {
    uid: creatorId,
    availableCents: 0,
    pendingCents: 0,
    currency: 'AUD',
  };
  const nextBalance: Balance = { ...balance, availableCents: balance.availableCents + planned.creditCents };
  return {
    purchase: planned.purchase,
    state: {
      ...state,
      purchases: [...state.purchases, planned.purchase],
      entitlements: [...state.entitlements, planned.entitlement],
      balances: [...state.balances.filter((item) => item.uid !== creatorId), nextBalance],
    },
  };
}

export function requestPayout(state: DemoState, uid: string, amountCents: number, now: string) {
  const creator = state.creators.find((item) => item.uid === uid);
  if (!creator || creator.kycStatus !== 'verified') throw new Error('Payouts require a verified identity check.');
  if (!Number.isInteger(amountCents) || amountCents < 1000) throw new Error('Minimum payout is A$10.00.');
  const balance = state.balances.find((item) => item.uid === uid);
  if (!balance || balance.availableCents < amountCents) throw new Error('Balance is too low.');
  const payout = {
    id: `payout_${now}`,
    creatorId: uid,
    amountCents,
    currency: 'AUD' as const,
    provider: 'airwallex' as const,
    providerTransferId: `awx_stub_${uid}_${Date.parse(now) || Date.now()}`,
    status: 'pending' as const,
    createdAt: now,
  };
  return {
    payout,
    state: {
      ...state,
      payouts: [...state.payouts, payout],
      balances: state.balances.map((item) => (item.uid === uid ? { ...item, availableCents: item.availableCents - amountCents } : item)),
    },
  };
}

export function exportData(state: DemoState, uid: string, now: string): DataExport {
  const user = requireUser(state, uid);
  const chatIds = new Set(state.chats.filter((chat) => chat.participantIds.includes(uid)).map((chat) => chat.id));
  const messages = Object.entries(state.messages)
    .filter(([chatId]) => chatIds.has(chatId))
    .flatMap(([, thread]) => thread);
  return {
    exportedAt: now,
    user,
    profile: profileFor(state, uid),
    creator: state.creators.find((item) => item.uid === uid) ?? null,
    posts: state.posts.filter((post) => post.creatorId === uid),
    likes: state.likes.filter((like) => like.fromUserId === uid || like.toUserId === uid),
    matches: state.matches.filter((match) => match.userIds.includes(uid)),
    messages,
    blocks: state.blocks.filter((block) => block.blockerId === uid || block.blockedId === uid),
    reportsFiled: state.reports.filter((report) => report.reporterId === uid),
    purchases: state.purchases.filter((purchase) => purchase.userId === uid),
    payouts: state.payouts.filter((payout) => payout.creatorId === uid),
  };
}

function draftMap(state: DemoState): Record<string, ProfileEditorDraft> {
  return state.profileDrafts ?? {};
}

function galleryOf(state: DemoState, uid: string, profile: DatingProfile): ProfilePhotoRecord[] {
  return draftMap(state)[uid]?.photos ?? legacyPhotos(profile);
}

function editorOf(profile: DatingProfile | null, photos: ProfilePhotoRecord[], draft: ProfileEditorDraft | undefined): ProfileEditor {
  return {
    profile,
    photos,
    textStatus: draft?.textStatus ?? 'none',
    textReason: draft?.textReason ?? null,
    textCategories: draft?.textCategories ?? [],
    textDraft: draft?.textDraft ?? null,
  };
}

export function profileEditor(state: DemoState, uid: string): ProfileEditor {
  const profile = profileFor(state, uid);
  const draft = draftMap(state)[uid];
  return editorOf(profile, profile ? galleryOf(state, uid, profile) : [], draft);
}

export function submitProfileText(state: DemoState, uid: string, input: ProfileTextInput): { state: DemoState; result: ProfileEditResult } {
  const user = requireUser(state, uid);
  if (!user.onboardingComplete) throw new Error('Finish onboarding first.');
  const profile = profileFor(state, uid);
  if (!profile) throw new Error('Finish onboarding first.');
  const parsed = normalizeProfileText(input);
  if (!parsed.ok) throw new Error(parsed.field);
  const photos = galleryOf(state, uid, profile);
  const existing = draftMap(state)[uid];
  if (!profileTextChanged(profile, parsed.value)) {
    const editor = editorOf(profile, photos, existing);
    return { state, result: { status: 'approved', reason: '', categories: [], profile, editor } };
  }
  const verdict = moderateProfileText(parsed.value);
  const published = profileAfterTextReview(profile, parsed.value, verdict.allowed);
  const draft: ProfileEditorDraft = {
    photos: existing?.photos ?? null,
    textStatus: verdict.allowed ? 'approved' : 'rejected',
    textReason: verdict.allowed ? null : verdict.reason,
    textCategories: verdict.allowed ? [] : verdict.categories,
    textDraft: verdict.allowed ? null : parsed.value,
  };
  const next: DemoState = {
    ...state,
    profiles: state.profiles.map((item) => (item.uid === uid ? published : item)),
    users: verdict.allowed
      ? state.users.map((item) => (item.uid === uid ? { ...item, displayName: parsed.value.displayName } : item))
      : state.users,
    profileDrafts: { ...draftMap(state), [uid]: draft },
  };
  return {
    state: next,
    result: {
      status: verdict.allowed ? 'approved' : 'rejected',
      reason: verdict.allowed ? '' : verdict.reason,
      categories: verdict.allowed ? [] : verdict.categories,
      profile: published,
      editor: editorOf(published, photos, draft),
    },
  };
}

function withPhotos(state: DemoState, uid: string, profile: DatingProfile, photos: ProfilePhotoRecord[]): DemoState {
  const published = projectPublicPhotos(profile, photos);
  const existing = draftMap(state)[uid];
  const draft: ProfileEditorDraft = {
    photos,
    textStatus: existing?.textStatus ?? 'none',
    textReason: existing?.textReason ?? null,
    textCategories: existing?.textCategories ?? [],
    textDraft: existing?.textDraft ?? null,
  };
  return {
    ...state,
    profiles: state.profiles.map((item) => (item.uid === uid ? published : item)),
    profileDrafts: { ...draftMap(state), [uid]: draft },
  };
}

export function addProfilePhoto(state: DemoState, uid: string, input: NewProfilePhoto): { state: DemoState; editor: ProfileEditor; photo: ProfilePhotoRecord } {
  requireUser(state, uid);
  const profile = profileFor(state, uid);
  if (!profile) throw new Error('Finish onboarding first.');
  if (!isProfilePhotoId(input.id)) throw new Error('photoId');
  const issue = photoUploadIssue(input.contentType, input.byteLength);
  if (issue) throw new Error(issue);
  const verdict = photoContentVerdict(input.fileName);
  const photo = settlePhotoModeration(
    {
      id: input.id,
      storagePath: `users/${uid}/photos/${input.id}`,
      status: 'pending',
      reason: null,
      publicUrl: null,
      ownerUrl: input.previewUrl,
    },
    verdict.allowed
      ? { allowed: true, reason: '', categories: [] }
      : { allowed: false, reason: verdict.reason, categories: verdict.categories },
    verdict.allowed ? input.previewUrl : null,
  );
  const photos = upsertPhoto(galleryOf(state, uid, profile), photo);
  if (!photos) throw new Error('photos');
  const next = withPhotos(state, uid, profile, photos);
  const published = profileFor(next, uid);
  return { state: next, photo, editor: editorOf(published, photos, next.profileDrafts?.[uid]) };
}

export function reorderProfilePhotos(state: DemoState, uid: string, ids: string[]): { state: DemoState; editor: ProfileEditor } {
  const profile = profileFor(state, uid);
  if (!profile) throw new Error('Finish onboarding first.');
  const photos = reorderPhotos(galleryOf(state, uid, profile), ids);
  if (!photos) throw new Error('photoIds');
  const next = withPhotos(state, uid, profile, photos);
  return { state: next, editor: editorOf(profileFor(next, uid), photos, next.profileDrafts?.[uid]) };
}

export function deleteProfilePhoto(state: DemoState, uid: string, id: string): { state: DemoState; editor: ProfileEditor } {
  const profile = profileFor(state, uid);
  if (!profile) throw new Error('Finish onboarding first.');
  const photos = removePhoto(galleryOf(state, uid, profile), id);
  if (!photos) throw new Error('Photo not found.');
  const next = withPhotos(state, uid, profile, photos);
  return { state: next, editor: editorOf(profileFor(next, uid), photos, next.profileDrafts?.[uid]) };
}

export function deleteAccount(state: DemoState, uid: string): DemoState {
  const chatIds = new Set(state.chats.filter((chat) => chat.participantIds.includes(uid)).map((chat) => chat.id));
  const messages = { ...state.messages };
  for (const chatId of chatIds) delete messages[chatId];
  return {
    ...state,
    users: state.users.filter((user) => user.uid !== uid),
    profiles: state.profiles.filter((profile) => profile.uid !== uid),
    likes: state.likes.filter((like) => like.fromUserId !== uid && like.toUserId !== uid),
    passes: state.passes.filter((pass) => pass.fromUserId !== uid && pass.toUserId !== uid),
    matches: state.matches.filter((match) => !match.userIds.includes(uid)),
    chats: state.chats.filter((chat) => !chat.participantIds.includes(uid)),
    messages,
    blocks: state.blocks.filter((block) => block.blockerId !== uid && block.blockedId !== uid),
    reports: state.reports.map((report) => (report.reporterId === uid ? { ...report, reporterId: DELETED } : report)),
    creators: state.creators.filter((creator) => creator.uid !== uid),
    posts: state.posts.filter((post) => post.creatorId !== uid),
    entitlements: state.entitlements.filter((item) => item.userId !== uid),
    purchases: state.purchases.map((purchase) => (purchase.userId === uid ? { ...purchase, userId: DELETED } : purchase)),
    balances: state.balances.filter((balance) => balance.uid !== uid),
    payouts: state.payouts.filter((payout) => payout.creatorId !== uid),
    kycSessions: state.kycSessions.filter((session) => session.userId !== uid),
    profileDrafts: Object.fromEntries(Object.entries(draftMap(state)).filter(([id]) => id !== uid)),
  };
}

export function reviewReport(state: DemoState, actorId: string, id: string, status: Report['status'], note: string, now: string): DemoState {
  const actor = requireUser(state, actorId);
  if (actor.role !== 'admin') throw new Error('Admin only.');
  if (status === 'open') throw new Error('Choose a review status.');
  return {
    ...state,
    reports: state.reports.map((report) =>
      report.id === id ? { ...report, status, adminNote: note, resolvedAt: status === 'reviewing' ? report.resolvedAt : now } : report,
    ),
  };
}

export function reviewPost(state: DemoState, actorId: string, id: string, status: 'approved' | 'rejected', note: string): DemoState {
  const actor = requireUser(state, actorId);
  if (actor.role !== 'admin') throw new Error('Admin only.');
  return {
    ...state,
    posts: state.posts.map((post) => (post.id === id ? { ...post, reviewStatus: status, reviewNote: note || null } : post)),
  };
}
