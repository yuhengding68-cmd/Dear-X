import assert from 'node:assert/strict';
import { mapFirebaseAuthCode, retryAfterSeconds } from './authErrors';
import { ageOn, calendarDate, isAtLeast18 } from './age';
import { decidePhoneSignIn, EMPTY_PHONE_LIMIT, PHONE_SIGN_IN_LIMITS } from './phoneSignInLimit';
import { hasPrivateAccountField } from './profileSafety';
import { resolveAppConfig } from '../config';
import { creatorShareCents, planPurchase } from './commerce';
import { applyLike } from './matching';
import { moderateWithKeywordStub } from './moderation';
import {
  profileSharePayload,
  projectPublicPhotos,
  settlePhotoModeration,
  sharePayloadLeaksPrivate,
  textFromProfile,
} from './profileEdit';
import { normalizePhone } from './phone';
import { addProfilePhoto, completeOnboarding, createPost, deleteAccount, deleteProfilePhoto, exportData, like, reorderProfilePhotos, sendMessage, submitProfileText, visibleCreators, visibleProfiles } from '../data/demo/logic';
import { createSeedState } from '../data/demo/seed';
import type { Creator } from '../types';

const sydneyEvening = new Date('2026-10-22T13:00:00.000Z');
assert.equal(calendarDate(sydneyEvening).day, 23);
assert.equal(isAtLeast18('2008-10-23', sydneyEvening), true);
assert.equal(isAtLeast18('2008-10-24', sydneyEvening), false);
assert.equal(isAtLeast18('2015-01-01', sydneyEvening), false);
assert.equal(ageOn('not-a-date'), null);

assert.equal(normalizePhone('+61', '400 000 002'), '+61400000002');
assert.equal(normalizePhone('+61', '0400000002'), '+61400000002');
assert.equal(normalizePhone('+61', '0299998888'), null);

assert.equal(mapFirebaseAuthCode('auth/invalid-verification-code'), 'invalid-code');
assert.equal(mapFirebaseAuthCode('auth/too-many-requests'), 'too-many-requests');
assert.equal(mapFirebaseAuthCode('functions/resource-exhausted'), 'too-many-requests');
assert.equal(mapFirebaseAuthCode('auth/popup-closed-by-user'), 'cancelled');
assert.equal(mapFirebaseAuthCode('auth/operation-not-allowed'), 'provider-disabled');
assert.equal(retryAfterSeconds(new Error('Wait 30 seconds')), 30);

const firstSend = decidePhoneSignIn(EMPTY_PHONE_LIMIT, 1_000, PHONE_SIGN_IN_LIMITS);
assert.equal(firstSend.allowed, true);
const cooled = decidePhoneSignIn(firstSend.next ?? EMPTY_PHONE_LIMIT, 1_000 + 10_000, PHONE_SIGN_IN_LIMITS);
assert.equal(cooled.allowed, false);
assert.equal(cooled.reason, 'cooldown');
assert.equal(cooled.retryAfterSeconds, 20);
let limited = firstSend.next ?? EMPTY_PHONE_LIMIT;
let sentAt = 1_000;
for (let i = 0; i < 4; i += 1) {
  sentAt += PHONE_SIGN_IN_LIMITS.minGapMs;
  const next = decidePhoneSignIn(limited, sentAt, PHONE_SIGN_IN_LIMITS);
  assert.equal(next.allowed, true);
  limited = next.next ?? limited;
}
const blockedWindow = decidePhoneSignIn(limited, sentAt + PHONE_SIGN_IN_LIMITS.minGapMs, PHONE_SIGN_IN_LIMITS);
assert.equal(blockedWindow.allowed, false);
assert.equal(blockedWindow.reason, 'window');

const fresh = createSeedState();
fresh.users.push({
  uid: 'user-new',
  role: 'user',
  phone: '+61400999111',
  provider: 'phone',
  dateOfBirth: null,
  displayName: '',
  createdAt: '2026-10-23T00:00:00.000Z',
  onboardingComplete: false,
  locale: 'en',
});
const onboarded = completeOnboarding(
  fresh,
  'user-new',
  {
    dateOfBirth: '2000-01-01',
    displayName: 'New Person',
    gender: 'unspecified',
    bio: 'Hello there',
    city: 'Sydney',
    interests: ['study'],
    photoUrl: null,
    acceptedTerms: true,
    locale: 'en',
  },
  '2026-10-23T00:00:00.000Z',
);
const publicProfile = onboarded.profiles.find((profile) => profile.uid === 'user-new');
assert.ok(publicProfile);
assert.equal(hasPrivateAccountField(publicProfile), false);
assert.equal(onboarded.users.find((user) => user.uid === 'user-new')?.dateOfBirth, '2000-01-01');
assert.throws(() =>
  completeOnboarding(
    fresh,
    'user-new',
    {
      dateOfBirth: '2015-01-01',
      displayName: 'Kid',
      gender: 'unspecified',
      bio: 'Hello there',
      city: 'Sydney',
      interests: ['study'],
      photoUrl: null,
      acceptedTerms: true,
      locale: 'en',
    },
    '2026-10-23T00:00:00.000Z',
  ),
);

assert.equal(resolveAppConfig({}).ok, false);
const demoMode = resolveAppConfig({ VITE_DATA_MODE: 'demo' });
assert.equal(demoMode.ok && demoMode.mode, 'demo');
assert.equal(resolveAppConfig({ VITE_DATA_MODE: 'firebase' }).ok, false);
const configured = resolveAppConfig({
  VITE_FIREBASE_API_KEY: 'k',
  VITE_FIREBASE_AUTH_DOMAIN: 'a',
  VITE_FIREBASE_PROJECT_ID: 'p',
  VITE_FIREBASE_APP_ID: 'app',
});
assert.equal(configured.ok && configured.mode, 'firebase');
const explicitDemo = resolveAppConfig({
  VITE_DATA_MODE: 'demo',
  VITE_FIREBASE_API_KEY: 'k',
  VITE_FIREBASE_AUTH_DOMAIN: 'a',
  VITE_FIREBASE_PROJECT_ID: 'p',
  VITE_FIREBASE_APP_ID: 'app',
});
assert.equal(explicitDemo.ok && explicitDemo.mode, 'demo');

assert.equal(creatorShareCents(499), 349);
assert.throws(() => planPurchase({
  userId: 'a',
  creatorId: 'b',
  kind: 'post',
  productId: 'p',
  amountCents: 499,
  platform: 'apple',
  token: 'not-a-receipt',
  now: '2026-10-23T00:00:00.000Z',
  alreadyOwned: false,
}));

const seed = createSeedState();
const deck = visibleProfiles(seed, 'user-alex');
assert.equal(deck.some((profile) => profile.uid === 'user-hao'), false);
assert.equal(deck.some((profile) => profile.uid === 'user-mei'), false);
assert.equal(deck.some((profile) => profile.uid === 'user-emily'), false);
assert.equal(deck.some((profile) => profile.uid === 'user-jun'), true);

const mutual = like(seed, 'user-alex', 'user-jun', '2026-10-23T00:00:00.000Z');
assert.equal(mutual.matched, true);
assert.ok(mutual.chatId);
assert.ok(Array.isArray(mutual.state.messages[mutual.chatId]));

const oneWay = like(seed, 'user-alex', 'user-sophie', '2026-10-23T00:00:00.000Z');
assert.equal(oneWay.matched, false);
assert.equal(
  oneWay.state.matches.some((match) => match.userIds.includes('user-sophie')),
  false,
);

const creators = visibleCreators(seed, 'user-alex');
assert.equal(creators.some((creator) => creator.uid === 'user-mei'), true);
assert.equal(creators.some((creator) => creator.uid === 'user-hao'), false);
const creator: Creator = creators[0];
assert.equal('city' in creator, false);
assert.equal('distanceKm' in creator, false);

const coffee = sendMessage(seed, 'user-alex', 'chat_user-alex_user-mei', 'Want to meet for coffee this week?', '2026-10-23T03:00:00.000Z');
assert.equal(coffee.state.messages['chat_user-alex_user-mei'].length, 3);
assert.throws(() => sendMessage(seed, 'user-alex', 'chat_user-alex_user-mei', 'I will pay you to meet', '2026-10-23T04:00:00.000Z'));

const pending = createPost(
  seed,
  'user-mei',
  { title: 'Reading notes', body: 'How I split a chapter into three sittings.', isPaid: false, priceCents: 0 },
  '2026-10-23T05:00:00.000Z',
);
assert.equal(pending.post.reviewStatus, 'pending');
const rejected = createPost(
  seed,
  'user-mei',
  { title: 'Nope', body: 'selling chat and companionship tonight', isPaid: false, priceCents: 0 },
  '2026-10-23T06:00:00.000Z',
);
assert.equal(rejected.post.reviewStatus, 'rejected');

const empty = applyLike(
  { likes: [], matches: [], chats: [], blocks: [], messages: {} },
  'a',
  'b',
  '2026-10-23T00:00:00.000Z',
);
assert.equal(empty.matched, false);

assert.equal(moderateWithKeywordStub('library on Sunday').allowed, true);

const exported = exportData(seed, 'user-alex', '2026-10-23T07:00:00.000Z');
assert.equal(exported.user.dateOfBirth, '2001-04-02');
assert.ok(exported.messages.some((message) => message.chatId === 'chat_user-alex_user-mei'));
assert.equal(exported.profile !== null && 'dateOfBirth' in exported.profile, false);

const removed = deleteAccount(seed, 'user-alex');
assert.equal(removed.users.some((user) => user.uid === 'user-alex'), false);
assert.equal(removed.profiles.some((profile) => profile.uid === 'user-alex'), false);
assert.equal(removed.messages['chat_user-alex_user-mei'], undefined);
assert.equal(removed.reports.some((report) => report.reporterId === 'deleted-user'), true);

const alex = seed.profiles.find((profile) => profile.uid === 'user-alex');
assert.ok(alex);
const alexBefore = alex.bio;
const invalidCity = { ...textFromProfile(alex), city: 'Bondi Beach' };
assert.throws(() => submitProfileText(seed, 'user-alex', invalidCity));
assert.throws(() => submitProfileText(seed, 'user-alex', { ...textFromProfile(alex), displayName: 'A' }));

const rejectedText = submitProfileText(seed, 'user-alex', { ...textFromProfile(alex), bio: 'send nudes', job: 'Student' });
assert.equal(rejectedText.result.status, 'rejected');
assert.equal(rejectedText.result.profile.bio, alexBefore);
assert.equal(rejectedText.result.profile.job, undefined);
assert.equal(rejectedText.state.users.find((user) => user.uid === 'user-alex')?.displayName, 'Alex Chen');
assert.equal(hasPrivateAccountField(rejectedText.result.profile), false);

const approvedText = submitProfileText(rejectedText.state, 'user-alex', {
  ...textFromProfile(rejectedText.result.profile),
  bio: 'Tea and quiet films.',
  job: 'Student',
});
assert.equal(approvedText.result.status, 'approved');
assert.equal(approvedText.result.profile.bio, 'Tea and quiet films.');
assert.equal(approvedText.result.profile.job, 'Student');
assert.equal(approvedText.result.profile.city, 'Sydney');
assert.equal(hasPrivateAccountField(approvedText.result.profile), false);
assert.equal(approvedText.state.users.find((user) => user.uid === 'user-alex')?.dateOfBirth, '2001-04-02');

const added = addProfilePhoto(approvedText.state, 'user-alex', {
  id: 'photo-aaa-111',
  fileName: 'portrait.png',
  contentType: 'image/png',
  byteLength: 32,
  previewUrl: 'https://cdn.example/portrait.png',
});
assert.equal(added.photo.status, 'approved');
assert.ok(added.editor.profile?.photoUrls?.includes('https://cdn.example/portrait.png'));

const blockedPhoto = addProfilePhoto(added.state, 'user-alex', {
  id: 'photo-bbb-222',
  fileName: 'nudes.png',
  contentType: 'image/png',
  byteLength: 32,
  previewUrl: 'https://cdn.example/private-nude.png',
});
assert.equal(blockedPhoto.photo.status, 'rejected');
assert.equal(blockedPhoto.photo.publicUrl, null);
assert.equal(blockedPhoto.editor.profile?.photoUrls?.includes('https://cdn.example/private-nude.png'), false);
assert.equal(JSON.stringify(blockedPhoto.editor.profile).includes('ownerUrl'), false);
assert.equal(blockedPhoto.editor.profile?.bio, 'Tea and quiet films.');

const ids = blockedPhoto.editor.photos.map((photo) => photo.id);
const portraitFirst = [ids.find((id) => id === 'photo-aaa-111')!, ...ids.filter((id) => id !== 'photo-aaa-111')];
const ordered = reorderProfilePhotos(blockedPhoto.state, 'user-alex', portraitFirst);
assert.equal(ordered.editor.profile?.photoUrl, 'https://cdn.example/portrait.png');
assert.equal(ordered.editor.profile?.photoUrls?.includes('https://cdn.example/private-nude.png'), false);

const removedPhoto = deleteProfilePhoto(ordered.state, 'user-alex', 'photo-aaa-111');
assert.equal(removedPhoto.editor.profile?.photoUrls?.includes('https://cdn.example/portrait.png'), false);
const stillRejected = removedPhoto.editor.photos.find((photo) => photo.id === 'photo-bbb-222');
assert.equal(stillRejected?.status, 'rejected');
assert.equal(removedPhoto.editor.profile?.photoUrls?.includes('https://cdn.example/private-nude.png'), false);

const unavailable = settlePhotoModeration(
  { id: 'photo-ccc-333', storagePath: 'users/user-alex/photos/photo-ccc-333', status: 'pending', reason: null, publicUrl: null },
  { unavailable: true },
  'https://cdn.example/should-not-publish.png',
);
assert.equal(unavailable.status, 'pending');
assert.equal(unavailable.publicUrl, null);
const denied = settlePhotoModeration(unavailable, { allowed: false, reason: 'nudity', categories: ['nudity'] }, 'https://cdn.example/should-not-publish.png');
const allowed = settlePhotoModeration(
  { ...unavailable, id: 'photo-ddd-444' },
  { allowed: true, reason: '', categories: [] },
  'https://cdn.example/ok.png',
);
const projected = projectPublicPhotos(approvedText.result.profile, [denied, allowed]);
assert.deepEqual(projected.photoUrls, ['https://cdn.example/ok.png']);
assert.equal(projected.photoUrl, 'https://cdn.example/ok.png');

const share = profileSharePayload(approvedText.result.profile, 'https://dearx.app/');
assert.equal(share.url, 'https://dearx.app/p/user-alex');
assert.equal(share.text.includes('Sydney'), true);
assert.equal(share.text.includes('Tea and quiet films'), false);
assert.equal(sharePayloadLeaksPrivate(share), false);
assert.equal(share.url.includes('+61'), false);
assert.equal(JSON.stringify(share).includes('2001-04-02'), false);

const cleared = deleteAccount(blockedPhoto.state, 'user-alex');
assert.equal(cleared.profileDrafts?.['user-alex'], undefined);

console.log('domain tests passed');
