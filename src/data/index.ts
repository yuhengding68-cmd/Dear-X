import type { AppConfig } from '../config';
import { createDemoRepository } from './demo/demoRepository';
import { createFirebaseRepository } from './firebaseRepository';
import type { Repository } from './repository';

export function createRepository(config: Extract<AppConfig, { ok: true }>): Repository {
  if (config.mode === 'demo') return createDemoRepository();
  if (!config.firebase) {
    throw new Error('Firebase mode requires a Firebase web config. Refusing to fall back to demo data.');
  }
  return createFirebaseRepository(config.firebase);
}

export type { Repository } from './repository';
