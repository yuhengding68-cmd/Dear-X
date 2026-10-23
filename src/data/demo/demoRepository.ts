import { denialKey } from '../../domain/age';
import { decidePhoneSignIn, EMPTY_PHONE_LIMIT, PHONE_SIGN_IN_LIMITS, type PhoneLimitState } from '../../domain/phoneSignInLimit';
import { createStubIapToken } from '../../domain/commerce';
import type { NewProfilePhoto, ProfileTextInput } from '../../domain/profileEdit';
import { normalizeAppPreferences, type AppPreferences } from '../../domain/activity';
import { normalizeDiscoverFilters, type DiscoverFilters } from '../../domain/discover';
import { isAccountBlocked, publishedSupportEmail } from '../../domain/safetyQueue';
import type { ReportAction } from '../../domain/safetyQueue';
import type {
  AuthProvider,
  AuthSession,
  CreatorStartInput,
  OnboardingInput,
  PostInput,
  PurchaseInput,
  ReportInput,
  ReportStatus,
} from '../../types';
import { RepoError } from '../errors';
import type { PhoneStart, Repository } from '../repository';
import {
  block,
  addProfilePhoto,
  completeOnboarding,
  completeStubKyc,
  deleteProfilePhoto,
  createPost,
  createSupportTicket,
  deleteAccount,
  exportData,
  fileReport,
  chatPresence,
  like,
  listInbox,
  markInboxRead,
  myReportStatuses,
  pass,
  profileEditor,
  presentReport,
  profileFor,
  reorderProfilePhotos,
  submitProfileText,
  pulsePresence,
  purchase,
  requestPayout,
  saveAppPreferences,
  saveDiscoverFilters,
  resolveReport,
  reviewPost,
  reviewReport,
  sendMessage,
  startCreator,
  startKyc,
  unblock,
  visibleChats,
  visibleCreators,
  visibleProfiles,
} from './logic';
import { createSeedState, DEMO_PHONES } from './seed';
import { DEMO_DB_KEY, DEMO_SESSION_KEY, type DemoState } from './state';

function nowIso(): string {
  return new Date().toISOString();
}

function loadState(): DemoState {
  const raw = localStorage.getItem(DEMO_DB_KEY);
  if (!raw) {
    const seeded = createSeedState();
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as DemoState;
}

function saveState(state: DemoState): void {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(state));
}

function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(DEMO_SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

function saveSession(session: AuthSession | null): void {
  if (!session) localStorage.removeItem(DEMO_SESSION_KEY);
  else localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

/**
 * Explicit demo/mock repository. Constructed only when VITE_DATA_MODE=demo.
 * Purchase and payout changes here mirror the server functions for the UI.
 * They are not the production money path.
 */
export function createDemoRepository(): Repository {
  let state = loadState();
  let session = loadSession();
  let pendingPhone: string | null = null;
  let phoneLimit: PhoneLimitState = EMPTY_PHONE_LIMIT;

  const reserveDemoPhone = () => {
    const decision = decidePhoneSignIn(phoneLimit, Date.now(), PHONE_SIGN_IN_LIMITS);
    if (!decision.allowed || !decision.next) {
      throw new RepoError('too-many-requests', String(decision.retryAfterSeconds));
    }
    phoneLimit = decision.next;
  };

  const persist = () => saveState(state);

  const uid = () => {
    if (!session) throw new RepoError('signed-out', 'Sign in required.');
    return session.uid;
  };

  const refresh = () => {
    state = loadState();
    session = loadSession();
  };

  const signInExisting = (userId: string, provider: AuthProvider, placeholderAuth: boolean): AuthSession => {
    const user = state.users.find((item) => item.uid === userId);
    if (!user) throw new RepoError('not-found', 'Account not found.');
    if (isAccountBlocked(user.accountStanding)) throw new RepoError('account-blocked', 'account-blocked');
    const next: AuthSession = {
      uid: user.uid,
      phone: user.phone,
      provider,
      placeholderAuth,
    };
    session = next;
    saveSession(next);
    return next;
  };

  return {
    mode: 'demo',
    async getSession() {
      refresh();
      return session;
    },
    async beginPhoneSignIn(e164: string): Promise<PhoneStart> {
      refresh();
      const denial = await denialKey(e164);
      if (state.ageDenials.includes(denial)) {
        throw new RepoError('underage', 'This number is blocked by the 18+ gate.');
      }
      reserveDemoPhone();
      const existing = state.users.find((user) => user.phone === e164);
      if (existing) {
        pendingPhone = null;
        return { status: 'signed-in', session: signInExisting(existing.uid, 'phone', true) };
      }
      pendingPhone = e164;
      return { status: 'code-sent', session: null };
    },
    async confirmPhoneCode(code: string) {
      refresh();
      if (!pendingPhone) throw new RepoError('code-expired', 'code-expired');
      if (code.trim() !== '000000') throw new RepoError('invalid-code', 'invalid-code');
      const e164 = pendingPhone;
      pendingPhone = null;
      const existing = state.users.find((user) => user.phone === e164);
      if (existing) return signInExisting(existing.uid, 'phone', true);
      const id = `user-${crypto.randomUUID()}`;
      state = {
        ...state,
        users: [
          ...state.users,
          {
            uid: id,
            role: 'user',
            phone: e164,
            provider: 'phone',
            dateOfBirth: null,
            displayName: '',
            createdAt: nowIso(),
            onboardingComplete: false,
            locale: 'en',
          },
        ],
      };
      persist();
      return signInExisting(id, 'phone', true);
    },
    async signInWithProvider(provider: 'apple' | 'google') {
      refresh();
      const id = `user-${provider}-${crypto.randomUUID()}`;
      state = {
        ...state,
        users: [
          ...state.users,
          {
            uid: id,
            role: 'user',
            phone: null,
            provider,
            dateOfBirth: null,
            displayName: '',
            createdAt: nowIso(),
            onboardingComplete: false,
            locale: 'en',
          },
        ],
      };
      persist();
      return signInExisting(id, provider, true);
    },
    async signOut() {
      session = null;
      saveSession(null);
    },
    async getAgeGateDenied() {
      refresh();
      if (!session) return false;
      const user = state.users.find((item) => item.uid === session?.uid);
      const keys = [await denialKey(`uid:${session.uid}`)];
      if (user?.phone) keys.push(await denialKey(user.phone));
      return keys.some((key) => state.ageDenials.includes(key));
    },
    async rejectUnderage(dateOfBirth: string) {
      const current = uid();
      const user = state.users.find((item) => item.uid === current);
      const keys = [await denialKey(`uid:${current}`)];
      if (user?.phone) keys.push(await denialKey(user.phone));
      state = deleteAccount(state, current);
      state = { ...state, ageDenials: [...new Set([...state.ageDenials, ...keys])] };
      persist();
      session = null;
      saveSession(null);
      void dateOfBirth;
    },
    async getMe() {
      refresh();
      if (!session) return null;
      return state.users.find((user) => user.uid === session?.uid) ?? null;
    },
    async getMyProfile() {
      refresh();
      if (!session) return null;
      return profileFor(state, session.uid);
    },
    async completeOnboarding(input: OnboardingInput) {
      try {
        state = completeOnboarding(state, uid(), input, nowIso());
      } catch (error) {
        throw new RepoError('onboarding', error instanceof Error ? error.message : 'Onboarding failed.');
      }
      persist();
      return state.users.find((user) => user.uid === uid())!;
    },
    async getProfileEditor() {
      refresh();
      return profileEditor(state, uid());
    },
    async submitProfileText(input: ProfileTextInput) {
      try {
        const result = submitProfileText(state, uid(), input);
        state = result.state;
        persist();
        return result.result;
      } catch (error) {
        throw new RepoError('profile', error instanceof Error ? error.message : 'profile');
      }
    },
    async addProfilePhoto(input: NewProfilePhoto) {
      try {
        const result = addProfilePhoto(state, uid(), input);
        state = result.state;
        persist();
        return result.editor;
      } catch (error) {
        throw new RepoError('profile', error instanceof Error ? error.message : 'profile');
      }
    },
    async reorderProfilePhotos(photoIds: string[]) {
      try {
        const result = reorderProfilePhotos(state, uid(), photoIds);
        state = result.state;
        persist();
        return result.editor;
      } catch (error) {
        throw new RepoError('profile', error instanceof Error ? error.message : 'profile');
      }
    },
    async deleteProfilePhoto(photoId: string) {
      try {
        const result = deleteProfilePhoto(state, uid(), photoId);
        state = result.state;
        persist();
        return result.editor;
      } catch (error) {
        throw new RepoError('profile', error instanceof Error ? error.message : 'profile');
      }
    },
    async getPublicProfile(profileId: string) {
      refresh();
      return profileFor(state, profileId);
    },
    async getDiscovery() {
      refresh();
      return visibleProfiles(state, uid());
    },
    async getDiscoverFilters() {
      refresh();
      const me = state.users.find((user) => user.uid === uid());
      return normalizeDiscoverFilters(me?.discoverFilters);
    },
    async saveDiscoverFilters(input: DiscoverFilters) {
      state = saveDiscoverFilters(state, uid(), input);
      persist();
      return normalizeDiscoverFilters(input);
    },
    async saveAppPreferences(input: AppPreferences) {
      state = saveAppPreferences(state, uid(), input);
      persist();
      const me = state.users.find((user) => user.uid === uid());
      return normalizeAppPreferences(me);
    },
    async listNotifications() {
      refresh();
      return listInbox(state, uid());
    },
    async markNotificationsRead(ids: string[]) {
      state = markInboxRead(state, uid(), ids, nowIso());
      persist();
    },
    async pulsePresence() {
      state = pulsePresence(state, uid(), nowIso());
      persist();
    },
    async getChatPresence(uids: string[]) {
      refresh();
      return chatPresence(state, uid(), uids, Date.now());
    },
    async registerPushToken() {
      return undefined;
    },
    async likeUser(toUserId: string) {
      try {
        const result = like(state, uid(), toUserId, nowIso());
        state = result.state;
        persist();
        return { matched: result.matched, matchId: result.matchId, chatId: result.chatId };
      } catch (error) {
        throw new RepoError('like', error instanceof Error ? error.message : 'Like failed.');
      }
    },
    async passUser(toUserId: string) {
      state = pass(state, uid(), toUserId, nowIso());
      persist();
    },
    async getMatches() {
      refresh();
      const me = uid();
      const blocked = new Set(
        state.blocks.flatMap((item) => (item.blockerId === me ? [item.blockedId] : item.blockedId === me ? [item.blockerId] : [])),
      );
      return state.matches
        .filter((match) => match.userIds.includes(me))
        .map((match) => {
          const other = match.userIds[0] === me ? match.userIds[1] : match.userIds[0];
          return { match, profile: blocked.has(other) ? null : profileFor(state, other), hidden: blocked.has(other) };
        })
        .filter((item) => !item.hidden)
        .map(({ match, profile }) => ({ match, profile }));
    },
    async getChats() {
      refresh();
      const me = uid();
      return visibleChats(state, me).map((chat) => {
        const other = chat.participantIds[0] === me ? chat.participantIds[1] : chat.participantIds[0];
        return { chat, profile: profileFor(state, other) };
      });
    },
    async getMessages(chatId: string) {
      refresh();
      const chat = visibleChats(state, uid()).find((item) => item.id === chatId);
      if (!chat) return [];
      return [...(state.messages[chatId] ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async sendMessage(chatId: string, text: string) {
      try {
        const result = sendMessage(state, uid(), chatId, text, nowIso());
        state = result.state;
        persist();
        return result.message;
      } catch (error) {
        throw new RepoError('moderation', error instanceof Error ? error.message : 'Message was not sent.');
      }
    },
    async fileReport(input: ReportInput) {
      try {
        const result = fileReport(state, uid(), input, nowIso());
        state = result.state;
        persist();
        return result.report;
      } catch (error) {
        throw new RepoError('report', error instanceof Error ? error.message : 'report');
      }
    },
    async listMyReports() {
      refresh();
      return myReportStatuses(state, uid(), Date.now());
    },
    async createSupportTicket(subject: string, message: string) {
      try {
        const result = createSupportTicket(state, uid(), publishedSupportEmail(import.meta.env.VITE_SUPPORT_EMAIL), subject, message, nowIso());
        state = result.state;
        persist();
        return result.ticket;
      } catch (error) {
        throw new RepoError('support', error instanceof Error ? error.message : 'support');
      }
    },
    async ensureAdminClaim() {
      refresh();
      const me = state.users.find((user) => user.uid === uid());
      if (me?.role !== 'admin') throw new RepoError('forbidden', 'Admin only.');
      return true;
    },
    async blockUser(userId: string) {
      state = block(state, uid(), userId, nowIso());
      persist();
    },
    async unblockUser(userId: string) {
      state = unblock(state, uid(), userId);
      persist();
    },
    async listBlocks() {
      refresh();
      const me = uid();
      return state.blocks
        .filter((entry) => entry.blockerId === me)
        .map((entry) => ({ block: entry, profile: profileFor(state, entry.blockedId) }));
    },
    async listCreators() {
      refresh();
      return visibleCreators(state, uid());
    },
    async getCreatorPage(id: string) {
      refresh();
      const creator = visibleCreators(state, uid()).find((item) => item.uid === id);
      if (!creator) return null;
      const posts = state.posts.filter((post) => post.creatorId === id && post.reviewStatus === 'approved');
      return { creator, posts };
    },
    async getMyCreator() {
      refresh();
      return state.creators.find((creator) => creator.uid === uid()) ?? null;
    },
    async listMyPosts() {
      refresh();
      return state.posts.filter((post) => post.creatorId === uid());
    },
    async myEntitlements() {
      refresh();
      return state.entitlements.filter((item) => item.userId === uid() && item.active);
    },
    async startCreatorProfile(input: CreatorStartInput) {
      try {
        state = startCreator(state, uid(), input, nowIso());
      } catch (error) {
        throw new RepoError('creator', error instanceof Error ? error.message : 'Could not start creator profile.');
      }
      persist();
      return state.creators.find((creator) => creator.uid === uid())!;
    },
    async startKyc() {
      const result = startKyc(state, uid(), 'didit', nowIso());
      state = result.state;
      persist();
      return result.session;
    },
    async completeStubKyc(result: 'verified' | 'rejected') {
      state = completeStubKyc(state, uid(), result);
      persist();
      return state.creators.find((creator) => creator.uid === uid())!;
    },
    async createPost(input: PostInput) {
      try {
        const result = createPost(state, uid(), input, nowIso());
        state = result.state;
        persist();
        return result.post;
      } catch (error) {
        throw new RepoError('post', error instanceof Error ? error.message : 'Post failed.');
      }
    },
    async purchase(input: PurchaseInput) {
      try {
        const result = purchase(state, uid(), input.kind, input.productId, input.platform, createStubIapToken(), nowIso());
        state = result.state;
        persist();
        return result.purchase;
      } catch (error) {
        throw new RepoError('purchase', error instanceof Error ? error.message : 'Purchase failed.');
      }
    },
    async getBalance() {
      refresh();
      return state.balances.find((balance) => balance.uid === uid()) ?? null;
    },
    async requestPayout(amountCents: number) {
      try {
        const result = requestPayout(state, uid(), amountCents, nowIso());
        state = result.state;
        persist();
        return result.payout;
      } catch (error) {
        throw new RepoError('payout', error instanceof Error ? error.message : 'Payout failed.');
      }
    },
    async exportData() {
      refresh();
      return exportData(state, uid(), nowIso());
    },
    async deleteAccount() {
      const current = uid();
      state = deleteAccount(state, current);
      persist();
      session = null;
      saveSession(null);
    },
    async listReportsForAdmin() {
      refresh();
      const me = state.users.find((user) => user.uid === uid());
      if (me?.role !== 'admin') throw new RepoError('forbidden', 'Admin only.');
      return state.reports.map((report) => presentReport(state, report)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async resolveReport(id: string, action: ReportAction, note: string) {
      try {
        state = resolveReport(state, uid(), id, action, note, nowIso());
      } catch (error) {
        throw new RepoError('forbidden', error instanceof Error ? error.message : 'Update failed.');
      }
      persist();
    },
    async reviewReport(id: string, status: ReportStatus, note: string) {
      try {
        state = reviewReport(state, uid(), id, status, note, nowIso());
      } catch (error) {
        throw new RepoError('forbidden', error instanceof Error ? error.message : 'Update failed.');
      }
      persist();
    },
    async listPendingPostsForAdmin() {
      refresh();
      const me = state.users.find((user) => user.uid === uid());
      if (me?.role !== 'admin') throw new RepoError('forbidden', 'Admin only.');
      return state.posts.filter((post) => post.reviewStatus === 'pending');
    },
    async reviewPost(id: string, status: 'approved' | 'rejected', note: string) {
      try {
        state = reviewPost(state, uid(), id, status, note);
      } catch (error) {
        throw new RepoError('forbidden', error instanceof Error ? error.message : 'Update failed.');
      }
      persist();
    },
    async resetDemo() {
      state = createSeedState();
      persist();
      session = null;
      saveSession(null);
    },
  };
}

export const demoPhones = DEMO_PHONES;
