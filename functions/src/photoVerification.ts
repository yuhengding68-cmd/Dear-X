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

export interface FaceMatchInput {
  selfie: Buffer;
  selfieType: string;
  references: Array<{ bytes: Buffer; type: string }>;
  pose: string;
}

export interface FaceMatchProvider {
  name: 'gemini' | 'rekognition';
  compare(input: FaceMatchInput): Promise<FaceReading>;
}

export function pickPose(roll: number): PhotoPose {
  const index = Math.abs(Math.floor(roll)) % PHOTO_POSES.length;
  return PHOTO_POSES[index] ?? 'smile';
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

const UNREADABLE: FaceReading = { samePerson: null, poseMatched: null, confidence: null };

export async function compareWithGemini(apiKey: string, input: FaceMatchInput): Promise<FaceReading> {
  if (!apiKey.trim() || input.references.length === 0 || input.selfie.length === 0) return UNREADABLE;
  const prompt = [
    'You compare a DearX photo-verification selfie with that same user\'s approved profile photos.',
    'Return JSON only: {"samePerson": boolean, "poseMatched": boolean, "confidence": number}.',
    'confidence is from 0 to 1.',
    'samePerson is true only when the selfie shows the same adult face as the profile photos.',
    'poseMatched is true only when the selfie clearly follows the requested pose.',
    'Do not describe the person, name features, or guess an identity document.',
    `Requested pose id: ${input.pose}`,
  ].join('\n');
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
    { text: 'Selfie' },
    { inlineData: { mimeType: input.selfieType || 'image/jpeg', data: input.selfie.toString('base64') } },
  ];
  input.references.slice(0, 3).forEach((reference, index) => {
    parts.push({ text: `Profile photo ${index + 1}` });
    parts.push({ inlineData: { mimeType: reference.type || 'image/jpeg', data: reference.bytes.toString('base64') } });
  });
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    });
    if (!response.ok) return UNREADABLE;
    const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = JSON.parse(raw) as { samePerson?: unknown; poseMatched?: unknown; confidence?: unknown };
    return {
      samePerson: typeof parsed.samePerson === 'boolean' ? parsed.samePerson : null,
      poseMatched: typeof parsed.poseMatched === 'boolean' ? parsed.poseMatched : null,
      confidence: normalizeConfidence(parsed.confidence),
    };
  } catch {
    return UNREADABLE;
  }
}

/**
 * Gemini is the working server provider. Rekognition is a named plug-in:
 * set PHOTO_MATCH_PROVIDER=rekognition only after a server adapter is deployed.
 * Until then that choice waits for admin review instead of approving anyone.
 */
export function selectFaceMatchProvider(apiKey: string): FaceMatchProvider {
  if ((process.env.PHOTO_MATCH_PROVIDER ?? 'gemini') === 'rekognition') {
    return { name: 'rekognition', async compare() { return UNREADABLE; } };
  }
  return { name: 'gemini', compare: (input) => compareWithGemini(apiKey, input) };
}
