import type { DataMode, FirebaseWebConfig } from './types';

export interface EnvLike {
  VITE_DATA_MODE?: string;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
}

export type AppConfig =
  | { ok: true; mode: DataMode; firebase?: FirebaseWebConfig }
  | { ok: false; reason: 'missing-mode' | 'incomplete-firebase' | 'invalid-mode' };

function filled(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function readFirebaseConfig(env: EnvLike): FirebaseWebConfig | null {
  if (
    !filled(env.VITE_FIREBASE_API_KEY) ||
    !filled(env.VITE_FIREBASE_AUTH_DOMAIN) ||
    !filled(env.VITE_FIREBASE_PROJECT_ID) ||
    !filled(env.VITE_FIREBASE_APP_ID)
  ) {
    return null;
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY.trim(),
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN.trim(),
    projectId: env.VITE_FIREBASE_PROJECT_ID.trim(),
    appId: env.VITE_FIREBASE_APP_ID.trim(),
    messagingSenderId: filled(env.VITE_FIREBASE_MESSAGING_SENDER_ID)
      ? env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim()
      : undefined,
    storageBucket: filled(env.VITE_FIREBASE_STORAGE_BUCKET) ? env.VITE_FIREBASE_STORAGE_BUCKET.trim() : undefined,
  };
}

/**
 * Demo data is used only when VITE_DATA_MODE=demo.
 * If Firebase config is absent and demo mode was not requested, configuration fails.
 * The app does not silently substitute mock data.
 */
export function resolveAppConfig(env: EnvLike): AppConfig {
  const requested = (env.VITE_DATA_MODE ?? '').trim().toLowerCase();
  const firebase = readFirebaseConfig(env);
  if (requested === 'demo') return { ok: true, mode: 'demo' };
  if (requested === 'firebase') {
    if (!firebase) return { ok: false, reason: 'incomplete-firebase' };
    return { ok: true, mode: 'firebase', firebase };
  }
  if (requested) return { ok: false, reason: 'invalid-mode' };
  if (firebase) return { ok: true, mode: 'firebase', firebase };
  return { ok: false, reason: 'missing-mode' };
}
