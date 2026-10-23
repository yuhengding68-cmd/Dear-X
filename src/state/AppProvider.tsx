import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isAccountBlocked } from '../domain/safetyQueue';
import type { Repository } from '../data/repository';
import type { AuthSession, PrivateUser } from '../types';

export type Tab = 'discover' | 'compass' | 'matches' | 'chats' | 'creators' | 'safety' | 'profile';

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
  | { name: 'settings' }
  | { name: 'public-profile'; uid: string };

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
  discoverNonce: number;
  refreshDiscovery: () => void;
  reloadMe: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function sharedProfileUid(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/p\/([^/]+)$/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function signedInHome(): Route[] {
  const uid = sharedProfileUid();
  const main: Route = { name: 'main', tab: 'discover' };
  return uid ? [main, { name: 'public-profile', uid }] : [main];
}

export function AppProvider({ repo, children }: { repo: Repository; children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [me, setMe] = useState<PrivateUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [stack, setStack] = useState<Route[]>([{ name: 'landing' }]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [discoverNonce, setDiscoverNonce] = useState(0);
  const route = stack[stack.length - 1] ?? { name: 'landing' };

  useEffect(() => {
    if (!session?.uid || !me || me.ghostMode === true) return;
    const beat = () => {
      void repo.pulsePresence().catch(() => undefined);
    };
    beat();
    const timer = window.setInterval(beat, 45_000);
    return () => window.clearInterval(timer);
  }, [repo, session?.uid, me?.uid, me?.ghostMode]);

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
        if (user && isAccountBlocked(user.accountStanding)) {
          try {
            sessionStorage.setItem('dearx.authError', 'account-blocked');
          } catch {
            /* The login screen reads this when storage is available. */
          }
          await repo.signOut();
          if (!cancelled) setStack([{ name: 'auth' }]);
          return;
        }
        setSession(existing);
        setMe(user);
        setStack(user?.onboardingComplete ? signedInHome() : [{ name: 'onboarding' }]);
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
        if (user && isAccountBlocked(user.accountStanding)) {
          try {
            sessionStorage.setItem('dearx.authError', 'account-blocked');
          } catch {
            /* The login screen reads this when storage is available. */
          }
          await repo.signOut();
          setSession(null);
          setMe(null);
          setStack([{ name: 'auth' }]);
          return;
        }
        setSession(next);
        setMe(user);
        setStack(user?.onboardingComplete ? signedInHome() : [{ name: 'onboarding' }]);
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
      discoverNonce,
      refreshDiscovery: () => setDiscoverNonce((current) => current + 1),
      reloadMe: async () => {
        const user = await repo.getMe();
        setMe(user);
      },
    }),
    [repo, session, me, booting, route, error, notice, discoverNonce],
  );

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
