import type { ProfileEditorDraft } from '../../domain/profileEdit';
import type {
  Balance,
  Block,
  Chat,
  Creator,
  CreatorPost,
  DatingProfile,
  Entitlement,
  KycSession,
  Like,
  Match,
  Message,
  ModerationAudit,
  Pass,
  Payout,
  PrivateUser,
  Purchase,
  Report,
  InboxItem,
  SupportTicket,
} from '../../types';

export interface DemoPhotoAudit {
  id: string;
  attemptId: string;
  uid: string;
  pose: string;
  decision: string;
  reasonCode: string;
  actorId: string;
  createdAt: string;
}

export interface DemoPhotoAttempt {
  id: string;
  uid: string;
  pose: string;
  status: 'awaiting_upload' | 'pending_review' | 'approved' | 'rejected';
  mainPhotoUrl: string;
  createdAt: string;
  decidedAt?: string;
  /** Present only until a decision deletes the selfie. */
  imageBase64?: string;
}

export type { DatingProfile, PrivateUser, Creator, CreatorPost, Report, Message };

/** Persisted demo database. Messages are a map of chat id → subcollection. */
export interface DemoState {
  users: PrivateUser[];
  profiles: DatingProfile[];
  likes: Like[];
  passes: Pass[];
  matches: Match[];
  chats: Chat[];
  messages: Record<string, Message[]>;
  reports: Report[];
  blocks: Block[];
  creators: Creator[];
  posts: CreatorPost[];
  purchases: Purchase[];
  entitlements: Entitlement[];
  balances: Balance[];
  payouts: Payout[];
  kycSessions: KycSession[];
  ageDenials: string[];
  /** Owner-only edit state. Absent until the first profile edit. */
  profileDrafts?: Record<string, ProfileEditorDraft>;
  auditLog?: ModerationAudit[];
  supportTickets?: SupportTicket[];
  inboxes?: Record<string, InboxItem[]>;
  photoAttempts?: DemoPhotoAttempt[];
  photoAudits?: DemoPhotoAudit[];
}

export const DEMO_DB_KEY = 'dearx.demo.db.v1';
export const DEMO_SESSION_KEY = 'dearx.demo.session.v1';
