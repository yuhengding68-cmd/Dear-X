/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string;
  /** `enterprise` (default) or `v3`. */
  readonly VITE_FIREBASE_APPCHECK_PROVIDER?: string;
  /** Local debug token only. Never commit a real value. */
  readonly VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
  /** Public support address shown in Help. Not a secret. */
  readonly VITE_SUPPORT_EMAIL?: string;
  /** Public web push certificate key from Firebase Cloud Messaging. Not a secret. */
  readonly VITE_FIREBASE_VAPID_KEY?: string;
}
