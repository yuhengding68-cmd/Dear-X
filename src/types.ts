export type Locale = 'en' | 'zh-CN';
export type DataMode = 'demo' | 'firebase';
export type UserRole = 'user' | 'admin';
export type Gender = 'woman' | 'man' | 'nonbinary' | 'unspecified';
export type AuthProvider = 'phone' | 'apple' | 'google';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed' | 'warned' | 'removed' | 'suspended' | 'banned';
export type AccountStanding = 'active' | 'warned' | 'suspended' | 'banned';
export type ReportTargetType = 'user' | 'message' | 'creator' | 'post';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type KycProviderName = 'didit' | 'veriff';
export type PurchaseKind = 'subscription' | 'post';
export type IapPlatform = 'apple' | 'google';
export type PayoutStatus = 'pending' | 'paid' | 'failed';
export type PayoutProviderName = 'airwallex';

export interface AuthSession {
  uid: string;
  phone: string | null;
  provider: AuthProvider;
  /** True when Apple/Google buttons did not complete a real OAuth flow. */
  placeholderAuth: boolean;
}

export interface PrivateUser {
  uid: string;
  role: UserRole;
  phone: string | null;
  provider: AuthProvider;
  /** Stored on the private user document only. Never copied to a public profile. */
  dateOfBirth: string | null;
  displayName: string;
  createdAt: string;
  onboardingComplete: boolean;
  locale: Locale;
  /** Server-owned. Suspended and banned accounts cannot sign in, discover, or chat. */
  accountStanding?: AccountStanding;
  warning?: { message: string; at: string; reportId: string } | null;
  /** Public profile held while the account is suspended or banned. */
  heldProfile?: DatingProfile | null;
  /** Private discovery settings. Missing fields use the server defaults. */
  discoverFilters?: {
    minAge: number;
    maxAge: number;
    maxDistanceKm: number;
    showGender: 'all' | 'man' | 'woman';
  };
  pushEnabled?: boolean;
  emailUpdates?: boolean;
  /** When true, the server does not store presence and does not record profile views. */
  ghostMode?: boolean;
  /** Server-written. Cleared while Ghost Mode is on. */
  lastSeenAt?: string | null;
  /** Server-written timestamps for the photo-verification rate limit. */
  photoVerifyAttempts?: number[];
  /** Latest photo-verification result. No selfie bytes. */
  photoVerification?: {
    attemptId: string;
    status: 'awaiting_upload' | 'pending_review' | 'approved' | 'rejected';
    pose: string;
    updatedAt: string;
  };
}

export interface DatingProfile {
  uid: string;
  displayName: string;
  age: number;
  gender: Gender;
  bio: string;
  city: string;
  /** Approximate label for dating discovery only. Never stored on a creator. */
  distanceKm: number | null;
  interests: string[];
  photoUrl: string | null;
  /** Extra photos for the card carousel (photoUrl first). Optional. */
  photoUrls?: string[];
  /** Coarse job label from the original swipe card. Optional. */
  job?: string;
  /** Real-person (selfie) verification passed. Set by the server only. */
  verified?: boolean;
}

export interface PhotoVerificationQueueItem {
  id: string;
  uid: string;
  displayName: string;
  pose: string;
  createdAt: string;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface Pass {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface Match {
  id: string;
  userIds: [string, string];
  createdAt: string;
  chatId: string;
}

export interface Chat {
  id: string;
  participantIds: [string, string];
  createdAt: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
}

/** A message lives in the chat's messages subcollection, not a global bucket. */
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  dueAt?: string;
  resolvedAt?: string;
  adminNote?: string;
  /** Captured when the report is filed, so later edits do not erase evidence. */
  snapshot?: ReportSnapshot;
}

export interface ReportSnapshot {
  displayName: string;
  bio: string;
  city: string;
  photoUrl: string | null;
  messageText: string | null;
}

export interface ModerationAudit {
  id: string;
  reportId: string;
  actorId: string;
  action: string;
  note: string;
  targetUserId: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  supportEmail: string;
  subject: string;
  message: string;
  status: 'open';
  createdAt: string;
}

export interface InboxItem {
  id: string;
  kind: 'match' | 'message' | 'report' | 'moderation';
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

export interface MyReportStatus {
  id: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  overdue: boolean;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

/**
 * Creator pages must not carry dating location.
 * The type-level assertion below fails compilation if a location field is added.
 */
export interface Creator {
  uid: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  kycStatus: KycStatus;
  kycProvider: KycProviderName | null;
  subscriptionPriceCents: number;
  currency: 'AUD';
  tosAcceptedAt: string | null;
  adultConfirmedAt: string | null;
}

type ForbiddenCreatorKeys = 'city' | 'distanceKm' | 'location' | 'lat' | 'lng' | 'dateOfBirth' | 'phone' | 'email';
type CreatorLeak = Extract<keyof Creator, ForbiddenCreatorKeys>;
export const creatorHasNoLocation: CreatorLeak extends never ? true : never = true;

type ForbiddenProfileKeys = 'phone' | 'email' | 'dateOfBirth' | 'role';
type ProfileLeak = Extract<keyof DatingProfile, ForbiddenProfileKeys>;
export const profileHasNoSecrets: ProfileLeak extends never ? true : never = true;

export interface CreatorPost {
  id: string;
  creatorId: string;
  title: string;
  body: string;
  isPaid: boolean;
  priceCents: number;
  currency: 'AUD';
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  creatorId: string;
  kind: PurchaseKind;
  productId: string;
  amountCents: number;
  currency: 'AUD';
  platform: IapPlatform;
  providerTransactionId: string;
  status: 'completed';
  createdAt: string;
}

export interface Entitlement {
  id: string;
  userId: string;
  creatorId: string;
  kind: PurchaseKind;
  productId: string;
  active: boolean;
  createdAt: string;
}

export interface Balance {
  uid: string;
  availableCents: number;
  pendingCents: number;
  currency: 'AUD';
}

export interface Payout {
  id: string;
  creatorId: string;
  amountCents: number;
  currency: 'AUD';
  provider: PayoutProviderName;
  providerTransferId: string;
  status: PayoutStatus;
  createdAt: string;
}

export interface KycSession {
  id: string;
  userId: string;
  provider: KycProviderName;
  status: KycStatus;
  redirectUrl: string;
  createdAt: string;
}

export type { ModerationVerdict } from './domain/moderation';

export interface OnboardingInput {
  dateOfBirth: string;
  displayName: string;
  gender: Gender;
  bio: string;
  city: string;
  interests: string[];
  photoUrl: string | null;
  acceptedTerms: boolean;
  locale: Locale;
}

export interface ReportInput {
  targetUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
}

export interface CreatorStartInput {
  bio: string;
  subscriptionPriceCents: number;
  tosAccepted: boolean;
  adultConfirmed: boolean;
}

export interface PostInput {
  title: string;
  body: string;
  isPaid: boolean;
  priceCents: number;
}

export interface PurchaseInput {
  kind: PurchaseKind;
  productId: string;
  platform: IapPlatform;
}

export interface DataExport {
  exportedAt: string;
  user: PrivateUser;
  profile: DatingProfile | null;
  creator: Creator | null;
  posts: CreatorPost[];
  likes: Like[];
  matches: Match[];
  messages: Message[];
  blocks: Block[];
  reportsFiled: Report[];
  purchases: Purchase[];
  payouts: Payout[];
}

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
}

export const AU_CITIES = [
  'Sydney',
  'Melbourne',
  'Brisbane',
  'Perth',
  'Adelaide',
  'Canberra',
  'Hobart',
  'Gold Coast',
] as const;

export const REPORT_REASONS = [
  'harassment',
  'spam',
  'sexual_content',
  'scam',
  'underage_concern',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
