export const ONLINE_MS = 90_000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AppPreferences {
  pushEnabled: boolean;
  emailUpdates: boolean;
  ghostMode: boolean;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  pushEnabled: true,
  emailUpdates: false,
  ghostMode: false,
};

export type InboxKind = 'match' | 'message' | 'report' | 'moderation';

export interface InboxItem {
  id: string;
  kind: InboxKind;
  createdAt: string;
  readAt: string | null;
  status?: string;
  chatId?: string;
}

export interface PresenceView {
  uid: string;
  online: boolean;
  minutesAgo: number | null;
}

export function normalizeAppPreferences(input: Partial<AppPreferences> | null | undefined): AppPreferences {
  return {
    pushEnabled: input?.pushEnabled !== false,
    emailUpdates: input?.emailUpdates === true,
    ghostMode: input?.ghostMode === true,
  };
}

/** Email is only eligible when the user left the toggle on. No provider is configured. */
export function maySendEmail(prefs: AppPreferences): boolean {
  return prefs.emailUpdates === true;
}

export function nextLastSeen(ghostMode: boolean, nowIso: string): string | null {
  return ghostMode ? null : nowIso;
}

export function presenceFrom(lastSeenAt: string | null | undefined, ghostMode: boolean, nowMs: number): Omit<PresenceView, 'uid'> {
  if (ghostMode || !lastSeenAt) return { online: false, minutesAgo: null };
  const seen = Date.parse(lastSeenAt);
  if (!Number.isFinite(seen)) return { online: false, minutesAgo: null };
  const age = nowMs - seen;
  if (age < 0 || age > DAY_MS) return { online: false, minutesAgo: null };
  if (age <= ONLINE_MS) return { online: true, minutesAgo: 0 };
  return { online: false, minutesAgo: Math.max(1, Math.floor(age / 60_000)) };
}

const STATUS = /^[a-z_]{3,20}$/;

export function makeInboxItem(kind: InboxKind, now: string, extra?: { status?: string; chatId?: string; id?: string }): InboxItem {
  const item: InboxItem = {
    id: extra?.id ?? `note_${kind}_${now}`,
    kind,
    createdAt: now,
    readAt: null,
  };
  if (extra?.status && STATUS.test(extra.status)) item.status = extra.status;
  if (extra?.chatId && /^[A-Za-z0-9_-]{1,120}$/.test(extra.chatId)) item.chatId = extra.chatId;
  return item;
}

/** Push and in-app copy are fixed. They never include a message, phone, email, or bio. */
export function pushCopy(kind: InboxKind): { title: string; body: string } {
  switch (kind) {
    case 'match':
      return { title: 'DearX', body: 'You have a new match.' };
    case 'message':
      return { title: 'DearX', body: 'You have a new message.' };
    case 'report':
      return { title: 'DearX', body: 'Your report was updated.' };
    case 'moderation':
      return { title: 'DearX', body: 'Your account was reviewed.' };
  }
}

export function inboxLeaksPrivate(item: InboxItem): boolean {
  return /dateOfBirth|\bphone\b|\bemail\b|\+\d{6,}|@|bio|messageText|nudes|https?:/i.test(JSON.stringify(item));
}
