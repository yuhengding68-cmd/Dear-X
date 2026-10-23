import type { FirebaseApp } from 'firebase/app';
import { CustomProvider, initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from 'firebase/app-check';

let starting: Promise<void> | null = null;

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function capacitorIos(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
  return Boolean(cap?.isNativePlatform?.() && cap.getPlatform?.() === 'ios');
}

function applyDebugToken(): void {
  const token = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim();
  if (!token) return;
  (globalThis as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = token;
}

async function iosAppCheckProvider(): Promise<CustomProvider | null> {
  if (!capacitorIos()) return null;
  try {
    const specifier = '@capacitor-firebase/app-check';
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      FirebaseAppCheck?: {
        initialize(options: { debug: boolean }): Promise<void>;
        getToken(options: { forceRefresh: boolean }): Promise<{ token: string; expireTimeMillis?: number }>;
      };
    };
    const plugin = mod.FirebaseAppCheck;
    if (!plugin) return null;
    await plugin.initialize({ debug: Boolean(import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim()) });
    return new CustomProvider({
      getToken: async () => {
        const result = await plugin.getToken({ forceRefresh: false });
        return {
          token: result.token,
          expireTimeMillis: result.expireTimeMillis ?? Date.now() + 60 * 60 * 1000,
        };
      },
    });
  } catch {
    return null;
  }
}

/** Attaches App Check when a site key or the iOS plugin is available. Login still starts if it is not configured yet. */
export function ensureAppCheck(app: FirebaseApp): Promise<void> {
  if (!starting) {
    starting = (async () => {
      applyDebugToken();
      const ios = await iosAppCheckProvider();
      if (ios) {
        initializeAppCheck(app, { provider: ios, isTokenAutoRefreshEnabled: true });
        return;
      }
      const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim();
      if (!siteKey) return;
      const provider =
        import.meta.env.VITE_FIREBASE_APPCHECK_PROVIDER?.trim() === 'v3'
          ? new ReCaptchaV3Provider(siteKey)
          : new ReCaptchaEnterpriseProvider(siteKey);
      initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
    })();
  }
  return starting;
}
