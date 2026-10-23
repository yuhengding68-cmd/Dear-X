/** SMS send throttle. Keep identical to src/domain/phoneSignInLimit.ts. */

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
  next?: PhoneLimitState;
}

export const PHONE_SIGN_IN_LIMITS: SignInLimits = {
  minGapMs: 30_000,
  windowMs: 60 * 60 * 1000,
  maxPerWindow: 5,
};

export const IP_SIGN_IN_LIMITS: SignInLimits = {
  minGapMs: 10_000,
  windowMs: 60 * 60 * 1000,
  maxPerWindow: 20,
};

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
