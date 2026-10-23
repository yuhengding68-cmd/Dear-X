import assert from 'node:assert/strict';
import { ageOn, calendarDate, isAtLeast18 } from './age';
import { resolveAppConfig } from '../config';
import { creatorShareCents, planPurchase } from './commerce';
import { applyLike } from './matching';
import { moderateWithKeywordStub } from './moderation';
import { normalizePhone } from './phone';
import { createPost, deleteAccount, exportData, like, sendMessage, visibleCreators, visibleProfiles } from '../data/demo/logic';
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

console.log('domain tests passed');
