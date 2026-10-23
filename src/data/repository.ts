import type { NewProfilePhoto, ProfileEditResult, ProfileEditor, ProfileTextInput } from '../domain/profileEdit';
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

export interface PhoneStart {
  status: 'signed-in' | 'code-sent';
  session: AuthSession | null;
}

export interface LikeOutcome {
  matched: boolean;
  matchId?: string;
  chatId?: string;
}

export interface CreatorPage {
  creator: Creator;
  posts: CreatorPost[];
}

/**
 * UI talks only to this interface.
 * `demo` is in-browser mock data. `firebase` reads Firestore and sends
 * mutations that change money, matches, or moderation through Cloud Functions.
 */
export interface Repository {
  readonly mode: 'demo' | 'firebase';
  getSession(): Promise<AuthSession | null>;
  beginPhoneSignIn(e164: string): Promise<PhoneStart>;
  confirmPhoneCode(code: string): Promise<AuthSession>;
  signInWithProvider(provider: 'apple' | 'google'): Promise<AuthSession>;
  signOut(): Promise<void>;
  getAgeGateDenied(): Promise<boolean>;
  rejectUnderage(dateOfBirth: string): Promise<void>;
  getMe(): Promise<PrivateUser | null>;
  /** Public dating profile for the signed-in user. Null before onboarding. */
  getMyProfile(): Promise<DatingProfile | null>;
  completeOnboarding(input: OnboardingInput): Promise<PrivateUser>;
  /** Public profile plus owner-only photo and text review state. */
  getProfileEditor(): Promise<ProfileEditor>;
  submitProfileText(input: ProfileTextInput): Promise<ProfileEditResult>;
  addProfilePhoto(input: NewProfilePhoto): Promise<ProfileEditor>;
  reorderProfilePhotos(photoIds: string[]): Promise<ProfileEditor>;
  deleteProfilePhoto(photoId: string): Promise<ProfileEditor>;
  /** Approved public profile only. No phone, date of birth, or draft text. */
  getPublicProfile(uid: string): Promise<DatingProfile | null>;
  getDiscovery(): Promise<DatingProfile[]>;
  likeUser(toUserId: string): Promise<LikeOutcome>;
  passUser(toUserId: string): Promise<void>;
  getMatches(): Promise<Array<{ match: Match; profile: DatingProfile | null }>>;
  getChats(): Promise<Array<{ chat: Chat; profile: DatingProfile | null }>>;
  getMessages(chatId: string): Promise<Message[]>;
  sendMessage(chatId: string, text: string): Promise<Message>;
  fileReport(input: ReportInput): Promise<Report>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  listBlocks(): Promise<Array<{ block: Block; profile: DatingProfile | null }>>;
  listCreators(): Promise<Creator[]>;
  getCreatorPage(uid: string): Promise<CreatorPage | null>;
  getMyCreator(): Promise<Creator | null>;
  listMyPosts(): Promise<CreatorPost[]>;
  myEntitlements(): Promise<Entitlement[]>;
  startCreatorProfile(input: CreatorStartInput): Promise<Creator>;
  startKyc(): Promise<KycSession>;
  completeStubKyc(result: 'verified' | 'rejected'): Promise<Creator>;
  createPost(input: PostInput): Promise<CreatorPost>;
  purchase(input: PurchaseInput): Promise<Purchase>;
  getBalance(): Promise<Balance | null>;
  requestPayout(amountCents: number): Promise<import('../types').Payout>;
  exportData(): Promise<DataExport>;
  deleteAccount(): Promise<void>;
  listReportsForAdmin(): Promise<Report[]>;
  reviewReport(id: string, status: ReportStatus, note: string): Promise<void>;
  listPendingPostsForAdmin(): Promise<CreatorPost[]>;
  reviewPost(id: string, status: 'approved' | 'rejected', note: string): Promise<void>;
  resetDemo(): Promise<void>;
}
