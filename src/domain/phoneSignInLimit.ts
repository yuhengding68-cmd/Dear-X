/** SMS send throttle. The Cloud Function copy in functions/src/phoneSignInLimit.ts must stay identical. */

export interface PhoneLimitState {
  attempts: number[];
  lastSentAt: number | null;
}

export interface SignInLimits {
  minGapMs: number;
  windowMs: number;
  maxPerWindow: number;
}

export interface SignInDecision {
  allowed: boolean;
  reason: 'ok' | 'cooldown' | 'window';
  retryAfterSeconds: number;
  /** Present only when this reservation is allowed. Persist it. */
  next?: PhoneLimitState;
}

/** One number: at least 30s between texts, and at most 5 texts per hour. */
export const PHONE_SIGN_IN_LIMITS: SignInLimits = {
  minGapMs: 30_000,
  windowMs: 60 * 60 * 1000,
  maxPerWindow: 5,
};

/** One IP: at least 10s between texts, and at most 20 texts per hour. */
export const IP_SIGN_IN_LIMITS: SignInLimits = {
  minGapMs: 10_000,
  windowMs: 60 * 60 * 1000,
  maxPerWindow: 20,
};

export const EMPTY_PHONE_LIMIT: PhoneLimitState = { attempts: [], lastSentAt: null };

export function decidePhoneSignIn(state: PhoneLimitState, now: number, limits: SignInLimits): SignInDecision {
  const attempts = state.attempts.filter((sentAt) => now - sentAt < limits.windowMs && sentAt <= now);
  const lastSentAt = attempts.length > 0 ? Math.max(...attempts) : null;
  if (lastSentAt !== null && now - lastSentAt < limits.minGapMs) {
    return {
      allowed: false,
      reason: 'cooldown',
      retryAfterSeconds: Math.ceil((limits.minGapMs - (now - lastSentAt)) / 1000),
    };
  }
  if (attempts.length >= limits.maxPerWindow) {
    const oldest = Math.min(...attempts);
    return {
      allowed: false,
      reason: 'window',
      retryAfterSeconds: Math.max(1, Math.ceil((limits.windowMs - (now - oldest)) / 1000)),
    };
  }
  const nextAttempts = [...attempts, now];
  return {
    allowed: true,
    reason: 'ok',
    retryAfterSeconds: 0,
    next: { attempts: nextAttempts, lastSentAt: now },
  };
}
