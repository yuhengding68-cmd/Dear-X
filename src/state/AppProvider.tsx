import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Repository } from '../data/repository';
import type { AuthSession, PrivateUser } from '../types';

export type Tab = 'discover' | 'matches' | 'chats' | 'creators' | 'safety' | 'profile';

export type Route =
  | { name: 'landing' }
  | { name: 'legal'; doc: 'privacy' | 'terms' }
  | { name: 'auth' }
  | { name: 'onboarding' }
  | { name: 'age-blocked' }
  | { name: 'main'; tab: Tab }
  | { name: 'chat'; chatId: string }
  | { name: 'creator'; creatorId: string }
  | { name: 'studio' }
  | { name: 'admin' }
  | { name: 'policy' }
  | { name: 'settings' };

interface AppContextValue {
  repo: Repository;
  session: AuthSession | null;
  me: PrivateUser | null;
  booting: boolean;
  route: Route;
  error: string | null;
  notice: string | null;
  setError: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  go: (route: Route) => void;
  back: () => void;
  enterSession: (session: AuthSession) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  blockForAge: (dateOfBirth: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ repo, children }: { repo: Repository; children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [me, setMe] = useState<PrivateUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [stack, setStack] = useState<Route[]>([{ name: 'landing' }]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const route = stack[stack.length - 1] ?? { name: 'landing' };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await repo.getSession();
        if (cancelled || !existing) return;
        const denied = await repo.getAgeGateDenied().catch(() => false);
        if (denied) {
          await repo.signOut();
          if (!cancelled) setStack([{ name: 'age-blocked' }]);
          return;
        }
        const user = await repo.getMe();
        if (cancelled) return;
        setSession(existing);
        setMe(user);
        setStack([user?.onboardingComplete ? { name: 'main', tab: 'discover' } : { name: 'onboarding' }]);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const api = useMemo<AppContextValue>(
    () => ({
      repo,
      session,
      me,
      booting,
      route,
      error,
      notice,
      setError,
      setNotice,
      go: (next) => {
        setError(null);
        setStack((current) => {
          const top = current[current.length - 1];
          if (top?.name === 'main' && next.name === 'main') return [...current.slice(0, -1), next];
          return [...current, next];
        });
      },
      back: () => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current)),
      enterSession: async (next) => {
        const denied = await repo.getAgeGateDenied().catch(() => false);
        if (denied) {
          await repo.signOut();
          setSession(null);
          setMe(null);
          setStack([{ name: 'age-blocked' }]);
          return;
        }
        const user = await repo.getMe();
        setSession(next);
        setMe(user);
        setStack([user?.onboardingComplete ? { name: 'main', tab: 'discover' } : { name: 'onboarding' }]);
      },
      finishOnboarding: async () => {
        const user = await repo.getMe();
        setMe(user);
        setStack([{ name: 'main', tab: 'discover' }]);
      },
      blockForAge: async (dateOfBirth) => {
        await repo.rejectUnderage(dateOfBirth);
        setSession(null);
        setMe(null);
        setStack([{ name: 'age-blocked' }]);
      },
      signOut: async () => {
        await repo.signOut();
        setSession(null);
        setMe(null);
        setStack([{ name: 'landing' }]);
      },
    }),
    [repo, session, me, booting, route, error, notice],
  );

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
