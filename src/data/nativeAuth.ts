import { RepoError } from './errors';

export interface NativeCredential {
  idToken?: string;
  accessToken?: string;
  nonce?: string;
}

export interface IosNativeAuth {
  signInWithPhoneNumber(options: { phoneNumber: string }): Promise<{ verificationId?: string }>;
  signInWithApple(): Promise<{ credential?: NativeCredential }>;
  signInWithGoogle(): Promise<{ credential?: NativeCredential }>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

export function isCapacitorIos(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  return Boolean(cap?.isNativePlatform?.() && cap.getPlatform?.() === 'ios');
}

/** Capacitor iOS uses the native Firebase Auth plugin. Web keeps the JS SDK. */
export async function loadIosNativeAuth(): Promise<IosNativeAuth | null> {
  if (!isCapacitorIos()) return null;
  try {
    const specifier = '@capacitor-firebase/authentication';
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      FirebaseAuthentication?: IosNativeAuth;
    };
    if (!mod.FirebaseAuthentication) throw new Error('missing plugin');
    return mod.FirebaseAuthentication;
  } catch {
    throw new RepoError('native-auth', 'native-auth');
  }
}
