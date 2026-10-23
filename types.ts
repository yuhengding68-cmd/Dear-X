

export enum MembershipLevel {
  Standard = 'Standard',
  Plus = 'Plus',
  Premium = 'Premium'
}

export enum UserRole {
  Sender = 'Sender',
  Receiver = 'Receiver'
}

export type ReportReason = 'inappropriate_content' | 'harassment' | 'spam' | 'fake_profile' | 'other';

export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  avatar: string;
  photos: string[];
  bio: string;
  job?: string;
  distance: string;
  role: UserRole;
  school?: string;
  isVerified: boolean;
  isKYCVerified: boolean;
  membership: MembershipLevel;
  tags: string[];
  blockedUsers?: string[]; // IDs of users this user has blocked
}

export interface Gift {
  id: string;
  name: string;
  price: number; // in AUD
  icon: string;
  type: 'Standard' | 'Advanced' | 'Luxury';
}

export interface Venue {
  id: string;
  name: string;
  type: 'Cafe' | 'Restaurant' | 'Activity' | 'Park';
  image: string;
  distance: string;
  rating: number;
  description: string;
  priceRange: '$' | '$$' | '$$$';
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  type?: 'text' | 'invite';
  inviteVenue?: Venue;
}

export interface ChatSession {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  giftId?: string;
  status: 'locked' | 'initial' | 'active' | 'expired' | 'violation';
  messages: Message[];
  createdAt: number;
  cycleStartDate?: number;
  senderMessageCount: number;
}

export interface Transaction {
  id: string;
  type: 'gift_sent' | 'earnings' | 'withdrawal';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  commentsList?: Comment[];
  timestamp: number;
  isLiked: boolean;
}

export interface LiveStream {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar: string;
  title: string;
  thumbnail: string;
  viewers: number;
  tags: string[];
}

export interface LeaderboardUser {
    id: string;
    rank: number;
    name: string;
    avatar: string;
    value: string;
    trend: 'up' | 'down' | 'same';
}