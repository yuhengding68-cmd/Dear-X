export const PHOTO_POSES = ['turn-left', 'turn-right', 'look-up', 'smile', 'two-fingers'] as const;
export type PhotoPose = (typeof PHOTO_POSES)[number];

export const PHOTO_VERIFY_LIMITS = {
  minGapMs: 60_000,
  windowMs: 24 * 60 * 60 * 1000,
  maxPerWindow: 5,
};

export interface FaceReading {
  samePerson: boolean | null;
  poseMatched: boolean | null;
  confidence: number | null;
}

export type PhotoDecision = 'match' | 'mismatch' | 'review';

export function pickPose(roll: number): PhotoPose {
  const index = Math.abs(Math.floor(roll)) % PHOTO_POSES.length;
  return PHOTO_POSES[index] ?? 'smile';
}

export function isPhotoPose(value: string): value is PhotoPose {
  return (PHOTO_POSES as readonly string[]).includes(value);
}

export function selfieStoragePath(uid: string, attemptId: string): string | null {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !/^[A-Za-z0-9_-]{8,80}$/.test(attemptId)) return null;
  return `users/${uid}/verification/${attemptId}.jpg`;
}

export function decidePhotoAttempt(attempts: number[], now: number): { allowed: boolean; retryAfterSeconds: number; next: number[] } {
  const recent = attempts.filter((sentAt) => Number.isFinite(sentAt) && sentAt <= now && now - sentAt < PHOTO_VERIFY_LIMITS.windowMs);
  const last = recent.length > 0 ? Math.max(...recent) : null;
  if (last !== null && now - last < PHOTO_VERIFY_LIMITS.minGapMs) {
    return { allowed: false, retryAfterSeconds: Math.ceil((PHOTO_VERIFY_LIMITS.minGapMs - (now - last)) / 1000), next: recent };
  }
  if (recent.length >= PHOTO_VERIFY_LIMITS.maxPerWindow) {
    const oldest = Math.min(...recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((PHOTO_VERIFY_LIMITS.windowMs - (now - oldest)) / 1000)),
      next: recent,
    };
  }
  return { allowed: true, retryAfterSeconds: 0, next: [...recent, now] };
}

export function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const score = value > 1 && value <= 100 ? value / 100 : value;
  if (score < 0 || score > 1) return null;
  return score;
}

/** A badge is allowed only for a confident same-person pose match. Everything else stays unverified. */
export function interpretFaceMatch(reading: FaceReading): { decision: PhotoDecision; reasonCode: string } {
  const confidence = normalizeConfidence(reading.confidence);
  const confident = confidence !== null && confidence >= 0.8;
  if (confident && reading.samePerson === true && reading.poseMatched === true) {
    return { decision: 'match', reasonCode: 'match' };
  }
  if (confident && reading.samePerson === false) {
    return { decision: 'mismatch', reasonCode: 'mismatch' };
  }
  if (reading.poseMatched === false) return { decision: 'review', reasonCode: 'pose' };
  return { decision: 'review', reasonCode: 'unreadable' };
}

export function verifiedFromDecision(decision: PhotoDecision): boolean {
  return decision === 'match';
}

/** Demo readings never call a network. Camera frames without a test marker wait for a person. */
export function demoFaceReading(bytes: Uint8Array): FaceReading {
  const head = new TextDecoder().decode(bytes.subarray(0, 80));
  if (head.includes('SAME')) return { samePerson: true, poseMatched: true, confidence: 0.95 };
  if (head.includes('OTHER')) return { samePerson: false, poseMatched: true, confidence: 0.91 };
  return { samePerson: null, poseMatched: null, confidence: null };
}

export function profileAfterMainPhotoChange<T extends { photoUrl: string | null; verified?: boolean }>(previous: T, next: T): T {
  if ((previous.photoUrl ?? null) === (next.photoUrl ?? null)) return next;
  if (next.verified !== true) return next;
  const rest = { ...next };
  delete rest.verified;
  return rest;
}

export function auditLeaksImage(value: unknown): boolean {
  return /imageBase64|data:image|inlineData|"bytes"|selfieBytes|faceTemplate/i.test(JSON.stringify(value));
}
