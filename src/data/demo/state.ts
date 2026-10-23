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
  Pass,
  Payout,
  PrivateUser,
  Purchase,
  Report,
} from '../../types';

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
}

export const DEMO_DB_KEY = 'dearx.demo.db.v1';
export const DEMO_SESSION_KEY = 'dearx.demo.session.v1';
