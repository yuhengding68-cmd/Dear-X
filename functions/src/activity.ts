import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const ONLINE_MS = 90_000;

export interface InboxItem {
  id: string;
  kind: 'match' | 'message' | 'report' | 'moderation';
  createdAt: string;
  readAt: string | null;
  status?: string;
  chatId?: string;
}

const STATUS = /^[a-z_]{3,20}$/;

export function pushCopy(kind: InboxItem['kind']): { title: string; body: string } {
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

export function makeInboxItem(kind: InboxItem['kind'], now: string, extra?: { status?: string; chatId?: string; id?: string }): InboxItem {
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

export async function appendInbox(db: Firestore, uid: string, item: InboxItem): Promise<void> {
  const ref = db.doc(`inboxes/${uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.get('items');
    const items = Array.isArray(current) ? (current as InboxItem[]) : [];
    tx.set(ref, { items: [item, ...items].slice(0, 40) }, { merge: true });
  });
}

export async function sendPushIfAllowed(db: Firestore, uid: string, kind: InboxItem['kind']): Promise<void> {
  const user = await db.doc(`users/${uid}`).get();
  if (user.get('pushEnabled') === false) return;
  const raw = user.get('pushTokens');
  const tokens = Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 5) : [];
  if (tokens.length === 0) return;
  const copy = pushCopy(kind);
  try {
    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: copy.title, body: copy.body },
      data: { kind },
    });
    const stale = result.responses.flatMap((response, index) => (response.success ? [] : [tokens[index]!]));
    if (stale.length > 0) {
      await db.doc(`users/${uid}`).set({ pushTokens: tokens.filter((token) => !stale.includes(token)) }, { merge: true });
    }
  } catch {
    /* The in-app row is already stored. A missing FCM setup must not fail the match or message. */
  }
}

export async function notifyUser(uid: string, item: InboxItem): Promise<void> {
  const db = getFirestore();
  await appendInbox(db, uid, item);
  if (item.kind === 'match' || item.kind === 'message') await sendPushIfAllowed(db, uid, item.kind);
}

export interface AppPreferences {
  pushEnabled: boolean;
  emailUpdates: boolean;
  ghostMode: boolean;
}

export function normalizeAppPreferences(input: Partial<AppPreferences> | null | undefined): AppPreferences {
  return {
    pushEnabled: input?.pushEnabled !== false,
    emailUpdates: input?.emailUpdates === true,
    ghostMode: input?.ghostMode === true,
  };
}

/** True only when the user turned email updates on. No mail provider is configured. */
export function maySendEmail(prefs: AppPreferences): boolean {
  return prefs.emailUpdates === true;
}

export function nextLastSeen(ghostMode: boolean, nowIso: string): string | null {
  return ghostMode ? null : nowIso;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function presenceFrom(
  lastSeenAt: string | null | undefined,
  ghostMode: boolean,
  nowMs: number,
): { online: boolean; minutesAgo: number | null } {
  if (ghostMode || !lastSeenAt) return { online: false, minutesAgo: null };
  const seen = Date.parse(lastSeenAt);
  if (!Number.isFinite(seen)) return { online: false, minutesAgo: null };
  const age = nowMs - seen;
  if (age < 0 || age > DAY_MS) return { online: false, minutesAgo: null };
  if (age <= ONLINE_MS) return { online: true, minutesAgo: 0 };
  return { online: false, minutesAgo: Math.max(1, Math.floor(age / 60_000)) };
}

export function readInboxItems(value: unknown): InboxItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is InboxItem => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Partial<InboxItem>;
    return typeof row.id === 'string' && (row.kind === 'match' || row.kind === 'message' || row.kind === 'report' || row.kind === 'moderation');
  });
}
