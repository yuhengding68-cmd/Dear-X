export const UNREVIEWED_PUBLIC_NAME = 'Member';

export interface OnboardingText {
  displayName: string;
  bio: string;
  interests: string[];
  city: string;
}

export interface OnboardingPhotoRecord {
  id: string;
  storagePath: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  publicUrl: string | null;
}

export function buildOnboardingPublication(input: {
  uid: string;
  age: number;
  gender: string;
  text: OnboardingText;
  photoUrl: string | null;
  textStatus: 'pending' | 'approved' | 'rejected';
  photoStatus: 'none' | 'pending' | 'approved' | 'rejected';
}): {
  profile: Record<string, unknown>;
  photos: OnboardingPhotoRecord[] | null;
  textStatus: 'pending' | 'approved' | 'rejected';
} {
  const textApproved = input.textStatus === 'approved';
  const photoApproved = input.photoStatus === 'approved' && Boolean(input.photoUrl);
  const profile: Record<string, unknown> = {
    uid: input.uid,
    displayName: textApproved ? input.text.displayName : UNREVIEWED_PUBLIC_NAME,
    age: input.age,
    gender: input.gender,
    bio: textApproved ? input.text.bio : '',
    city: input.text.city,
    distanceKm: null,
    interests: textApproved ? input.text.interests : [],
    photoUrl: photoApproved ? input.photoUrl : null,
    photoUrls: photoApproved && input.photoUrl ? [input.photoUrl] : [],
  };
  const photos = input.photoStatus === 'none' || !input.photoUrl
    ? null
    : [
        {
          id: 'onboarding-photo',
          storagePath: '',
          status: input.photoStatus,
          reason: input.photoStatus === 'approved' ? null : 'moderation',
          publicUrl: photoApproved ? input.photoUrl : null,
        },
      ];
  return {
    profile,
    photos,
    textStatus: input.textStatus,
  };
}

export function safePublicHttps(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host === 'metadata.google.internal') return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0)/.test(host) || host === '::1') return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}
