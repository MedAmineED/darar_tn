'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
} from '@/lib/api/auth';
import { setAuthFailureHandler } from '@/lib/api/client';
import { tokenStore } from '@/lib/api/token-store';
import type { AuthUser } from '@/lib/api/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const clearSession = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Restore the session from the refresh cookie on first load.
  useEffect(() => {
    let active = true;
    refreshSession()
      .then((session) => {
        if (!active) return;
        tokenStore.set(session.accessToken);
        setUser(session.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        clearSession();
      });
    return () => {
      active = false;
    };
  }, [clearSession]);

  // If a refresh fails mid-session, drop back to the login screen.
  useEffect(() => {
    setAuthFailureHandler(() => clearSession());
    return () => setAuthFailureHandler(null);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await apiLogin(email, password);
    tokenStore.set(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasPermission = useCallback(
    (permission: string) =>
      Boolean(user && (user.isSuperAdmin || user.permissions.includes(permission))),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, signOut, hasPermission }),
    [user, status, login, signOut, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
