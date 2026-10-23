/** Stable sign-in errors. The login screen translates these codes and does not show raw Firebase text. */

export type AuthErrorCode =
  | 'invalid-phone'
  | 'too-many-requests'
  | 'quota'
  | 'captcha'
  | 'app-check'
  | 'invalid-code'
  | 'code-expired'
  | 'network'
  | 'cancelled'
  | 'popup-blocked'
  | 'account-exists'
  | 'unauthorized-domain'
  | 'provider-disabled'
  | 'app-not-authorized'
  | 'native-auth'
  | 'auth-unavailable'
  | 'underage'
  | 'internal';

export function firebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  return '';
}

export function mapFirebaseAuthCode(code: string): AuthErrorCode {
  const normalized = code.replace(/^functions\//, '').replace(/^auth\//, '');
  switch (normalized) {
    case 'invalid-phone-number':
    case 'missing-phone-number':
    case 'invalid-argument':
      return 'invalid-phone';
    case 'too-many-requests':
    case 'resource-exhausted':
      return 'too-many-requests';
    case 'quota-exceeded':
      return 'quota';
    case 'captcha-check-failed':
    case 'invalid-app-credential':
      return 'captcha';
    case 'missing-client-identifier':
    case 'app-check-token-invalid':
    case 'firebase-app-check-token-is-invalid':
      return 'app-check';
    case 'invalid-verification-code':
    case 'invalid-credential':
      return 'invalid-code';
    case 'code-expired':
    case 'invalid-verification-id':
    case 'session-expired':
    case 'missing-verification-code':
    case 'missing-verification-id':
      return 'code-expired';
    case 'network-request-failed':
    case 'timeout':
    case 'unavailable':
    case 'not-found':
      return 'network';
    case 'popup-closed-by-user':
    case 'cancelled-popup-request':
    case 'user-cancelled':
    case 'web-context-cancelled':
      return 'cancelled';
    case 'popup-blocked':
    case 'operation-not-supported-in-this-environment':
      return 'popup-blocked';
    case 'account-exists-with-different-credential':
    case 'credential-already-in-use':
    case 'email-already-in-use':
      return 'account-exists';
    case 'unauthorized-domain':
      return 'unauthorized-domain';
    case 'operation-not-allowed':
      return 'provider-disabled';
    case 'app-not-authorized':
    case 'invalid-api-key':
      return 'app-not-authorized';
    default:
      return 'internal';
  }
}

export function retryAfterSeconds(error: unknown): number | null {
  const message = error instanceof Error ? error.message : '';
  const match = message.match(/\d+/);
  if (!match) return null;
  const seconds = Number(match[0]);
  return Number.isFinite(seconds) ? seconds : null;
}
