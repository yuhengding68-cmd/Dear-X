import { moderateWithKeywordStub, type ModerationVerdict } from './moderation';
import { AU_CITIES, type DatingProfile } from '../types';

export const MAX_PROFILE_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PROFILE_INTERESTS = ['study', 'food', 'film', 'tea', 'photography', 'badminton', 'music', 'language', 'hiking', 'art', 'sport'] as const;

export type ProfilePhotoStatus = 'pending' | 'approved' | 'rejected';
export type ProfileTextStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface ProfileTextInput {
  displayName: string;
  bio: string;
  interests: string[];
  city: string;
  job: string;
}

export interface ProfilePhotoRecord {
  id: string;
  storagePath: string;
  status: ProfilePhotoStatus;
  reason: string | null;
  /** Download URL copied onto the public profile only when status is approved. */
  publicUrl: string | null;
  /** Owner-only preview. Never copied onto a public profile. */
  ownerUrl?: string | null;
}

export interface ProfileEditorDraft {
  photos: ProfilePhotoRecord[] | null;
  textStatus: ProfileTextStatus;
  textReason: string | null;
  textCategories: string[];
  textDraft: ProfileTextInput | null;
}

export interface ProfileEditor {
  profile: DatingProfile | null;
  photos: ProfilePhotoRecord[];
  textStatus: ProfileTextStatus;
  textReason: string | null;
  textCategories: string[];
  textDraft: ProfileTextInput | null;
}

export interface ProfileEditResult {
  status: 'approved' | 'rejected';
  reason: string;
  categories: string[];
  profile: DatingProfile;
  editor: ProfileEditor;
}

export interface NewProfilePhoto {
  id: string;
  fileName: string;
  contentType: string;
  byteLength: number;
  previewUrl: string;
  bytes?: Uint8Array;
}

export type ProfileField = 'name' | 'bio' | 'city' | 'job' | 'interests' | 'photos' | 'type' | 'size';

const PHOTO_ID = /^[A-Za-z0-9-]{8,80}$/;

export function isProfilePhotoId(id: string): boolean {
  return PHOTO_ID.test(id);
}

export function normalizePhotoContentType(contentType: string): string {
  const value = contentType.trim().toLowerCase();
  return value === 'image/jpg' ? 'image/jpeg' : value;
}

export function photoUploadIssue(contentType: string, byteLength: number): 'type' | 'size' | null {
  const type = normalizePhotoContentType(contentType);
  if (!PHOTO_CONTENT_TYPES.includes(type as (typeof PHOTO_CONTENT_TYPES)[number])) return 'type';
  if (!Number.isInteger(byteLength) || byteLength < 1 || byteLength > MAX_PHOTO_BYTES) return 'size';
  return null;
}

export function normalizeProfileText(input: ProfileTextInput): { ok: true; value: ProfileTextInput } | { ok: false; field: ProfileField } {
  const displayName = input.displayName.trim();
  const bio = input.bio.trim();
  const job = input.job.trim();
  const city = input.city.trim();
  const interests = input.interests.map((item) => item.trim()).filter(Boolean);
  if (displayName.length < 2 || displayName.length > 40) return { ok: false, field: 'name' };
  if (!bio || bio.length > 500) return { ok: false, field: 'bio' };
  if (job.length > 40) return { ok: false, field: 'job' };
  if (!AU_CITIES.includes(city as (typeof AU_CITIES)[number])) return { ok: false, field: 'city' };
  if (interests.length > 8 || interests.some((item) => item.length > 24)) return { ok: false, field: 'interests' };
  return { ok: true, value: { displayName, bio, interests, city, job } };
}

export function profileTextChanged(profile: DatingProfile, next: ProfileTextInput): boolean {
  return (
    profile.displayName !== next.displayName ||
    profile.bio !== next.bio ||
    (profile.job ?? '') !== next.job ||
    profile.city !== next.city ||
    profile.interests.join('\n') !== next.interests.join('\n')
  );
}

/** Keyword gate used by demo mode. Cloud Functions run this, then Gemini, and fail closed. */
export function moderateProfileText(
  value: ProfileTextInput,
  moderate: (text: string) => ModerationVerdict = moderateWithKeywordStub,
): { allowed: true } | { allowed: false; reason: string; categories: string[] } {
  const chunks = [value.displayName, value.bio, value.job, ...value.interests].map((item) => item.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const verdict = moderate(chunk);
    if (!verdict.allowed) return { allowed: false, reason: verdict.reason, categories: verdict.categories };
  }
  return { allowed: true };
}

/**
 * A rejected edit keeps the last approved public text.
 * Age, gender, photos, and verification are not taken from the edit form.
 */
export function profileAfterTextReview(profile: DatingProfile, value: ProfileTextInput, allowed: boolean): DatingProfile {
  if (!allowed) return profile;
  const next: DatingProfile = {
    ...profile,
    displayName: value.displayName,
    bio: value.bio,
    city: value.city,
    interests: [...value.interests],
  };
  if (value.job) next.job = value.job;
  else delete next.job;
  return next;
}

export function legacyPhotos(profile: DatingProfile | null): ProfilePhotoRecord[] {
  if (!profile) return [];
  const urls = profile.photoUrls?.length ? profile.photoUrls : profile.photoUrl ? [profile.photoUrl] : [];
  return urls.filter((url) => typeof url === 'string' && url.length > 0).map((url, index) => ({
    id: `legacy-${index}`,
    storagePath: '',
    status: 'approved' as const,
    reason: null,
    publicUrl: url,
  }));
}

/** Public cards receive approved URLs only, in the owner's order. */
export function projectPublicPhotos(profile: DatingProfile, photos: ProfilePhotoRecord[]): DatingProfile {
  const urls = photos.filter((photo) => photo.status === 'approved' && typeof photo.publicUrl === 'string' && photo.publicUrl.length > 0).map((photo) => photo.publicUrl as string);
  return { ...profile, photoUrl: urls[0] ?? null, photoUrls: urls };
}

export function photoContentVerdict(fileName: string): ModerationVerdict {
  const base = fileName.replace(/^.*[/\\]/, '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();
  return moderateWithKeywordStub(base || 'photo');
}

/**
 * Fail closed: an unavailable moderator leaves the photo pending and unpublished.
 * An explicit reject never receives a public URL.
 */
export function settlePhotoModeration(
  photo: ProfilePhotoRecord,
  verdict: { allowed: boolean; reason: string; categories: string[] } | { unavailable: true },
  approvedUrl: string | null,
): ProfilePhotoRecord {
  if ('unavailable' in verdict) {
    return { ...photo, status: 'pending', publicUrl: null, reason: null };
  }
  if (!verdict.allowed) {
    return { ...photo, status: 'rejected', publicUrl: null, reason: verdict.reason || verdict.categories[0] || 'rejected' };
  }
  return { ...photo, status: 'approved', publicUrl: approvedUrl, reason: null };
}

export function upsertPhoto(photos: ProfilePhotoRecord[], photo: ProfilePhotoRecord): ProfilePhotoRecord[] | null {
  const index = photos.findIndex((item) => item.id === photo.id);
  if (index >= 0) {
    const next = photos.slice();
    next[index] = photo;
    return next;
  }
  if (photos.length >= MAX_PROFILE_PHOTOS) return null;
  return [...photos, photo];
}

export function reorderPhotos(photos: ProfilePhotoRecord[], ids: string[]): ProfilePhotoRecord[] | null {
  if (ids.length !== photos.length || new Set(ids).size !== ids.length) return null;
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const next: ProfilePhotoRecord[] = [];
  for (const id of ids) {
    const photo = byId.get(id);
    if (!photo) return null;
    next.push(photo);
  }
  return next;
}

export function removePhoto(photos: ProfilePhotoRecord[], id: string): ProfilePhotoRecord[] | null {
  if (!photos.some((photo) => photo.id === id)) return null;
  return photos.filter((photo) => photo.id !== id);
}

export function profileSharePayload(profile: Pick<DatingProfile, 'uid' | 'displayName' | 'city'>, origin: string): { title: string; text: string; url: string } {
  const base = origin.replace(/\/$/, '');
  return {
    title: profile.displayName,
    text: [profile.displayName, profile.city].filter(Boolean).join(' · '),
    url: `${base}/p/${encodeURIComponent(profile.uid)}`,
  };
}

/** The share sheet and URL may carry the public id, name, and city. Nothing else. */
export function sharePayloadLeaksPrivate(payload: { title: string; text: string; url: string }): boolean {
  const blob = `${payload.title}\n${payload.text}\n${payload.url}`;
  return /dateOfBirth|\bphone\b|\bemail\b|\+\d{6,}|provider|role/i.test(blob);
}

export const UNREVIEWED_PUBLIC_NAME = 'Member';

export type OnboardingVerdict = 'approved' | 'rejected' | 'pending';

/**
 * Public onboarding profile. Unreviewed text and photos stay off the public
 * document until a verdict is approved. Pending and rejected both withhold.
 */
export function buildOnboardingPublication(input: {
  uid: string;
  age: number;
  gender: DatingProfile['gender'];
  text: ProfileTextInput;
  photoUrl: string | null;
  textVerdict: OnboardingVerdict;
  textReason: string;
  textCategories: string[];
  photoVerdict: OnboardingVerdict | 'none';
  photoReason: string | null;
}): {
  profile: DatingProfile;
  draft: ProfileEditorDraft;
} {
  const textApproved = input.textVerdict === 'approved';
  const photoApproved = input.photoVerdict === 'approved' && Boolean(input.photoUrl);
  const profile: DatingProfile = {
    uid: input.uid,
    displayName: textApproved ? input.text.displayName : UNREVIEWED_PUBLIC_NAME,
    age: input.age,
    gender: input.gender,
    bio: textApproved ? input.text.bio : '',
    city: input.text.city,
    distanceKm: null,
    interests: textApproved ? [...input.text.interests] : [],
    photoUrl: photoApproved ? input.photoUrl : null,
  };
  if (photoApproved && input.photoUrl) profile.photoUrls = [input.photoUrl];
  const photos: ProfilePhotoRecord[] | null = input.photoVerdict === 'none' || !input.photoUrl
    ? null
    : [
        {
          id: 'onboarding-photo',
          storagePath: '',
          status: input.photoVerdict === 'approved' ? 'approved' : input.photoVerdict === 'rejected' ? 'rejected' : 'pending',
          reason: input.photoVerdict === 'approved' ? null : input.photoReason,
          publicUrl: photoApproved ? input.photoUrl : null,
          ownerUrl: input.photoUrl,
        },
      ];
  if (photos && photoApproved) profile.photoUrl = input.photoUrl;
  return {
    profile,
    draft: {
      photos,
      textStatus: input.textVerdict,
      textReason: textApproved ? null : input.textReason || null,
      textCategories: textApproved ? [] : input.textCategories,
      textDraft: textApproved ? null : input.text,
    },
  };
}

export function textFromProfile(profile: DatingProfile): ProfileTextInput {
  return {
    displayName: profile.displayName,
    bio: profile.bio,
    interests: [...profile.interests],
    city: profile.city,
    job: profile.job ?? '',
  };
}
