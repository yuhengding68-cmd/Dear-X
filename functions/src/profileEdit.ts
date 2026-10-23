import { moderateWithKeywordStub, type ModerationVerdict } from './keywordModeration';

export const MAX_PROFILE_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const AU_CITIES = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Gold Coast'] as const;

export type ProfilePhotoStatus = 'pending' | 'approved' | 'rejected';

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
  publicUrl: string | null;
}

export interface PublicProfileShape {
  uid: string;
  displayName: string;
  age: number;
  gender: string;
  bio: string;
  city: string;
  distanceKm: number | null;
  interests: string[];
  photoUrl: string | null;
  photoUrls: string[];
  verified?: boolean;
  job?: string;
}

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

export function normalizeProfileText(input: ProfileTextInput): { ok: true; value: ProfileTextInput } | { ok: false; field: string } {
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

export function profileTextChanged(profile: PublicProfileShape, next: ProfileTextInput): boolean {
  return (
    profile.displayName !== next.displayName ||
    profile.bio !== next.bio ||
    (profile.job ?? '') !== next.job ||
    profile.city !== next.city ||
    profile.interests.join('\n') !== next.interests.join('\n')
  );
}

export function keywordProfileText(value: ProfileTextInput): ModerationVerdict {
  const chunks = [value.displayName, value.bio, value.job, ...value.interests].map((item) => item.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const verdict = moderateWithKeywordStub(chunk);
    if (!verdict.allowed) return verdict;
  }
  return { allowed: true, categories: [], reason: '' };
}

export function profileAfterTextReview(profile: PublicProfileShape, value: ProfileTextInput, allowed: boolean): PublicProfileShape {
  if (!allowed) return profile;
  const next: PublicProfileShape = {
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

export function projectPublicPhotos(profile: PublicProfileShape, photos: ProfilePhotoRecord[]): PublicProfileShape {
  const urls = photos.filter((photo) => photo.status === 'approved' && photo.publicUrl).map((photo) => photo.publicUrl as string);
  return { ...profile, photoUrl: urls[0] ?? null, photoUrls: urls };
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

export function legacyPhotos(urls: string[]): ProfilePhotoRecord[] {
  return urls.filter((url) => url.length > 0).map((url, index) => ({
    id: `legacy-${index}`,
    storagePath: '',
    status: 'approved' as const,
    reason: null,
    publicUrl: url,
  }));
}
