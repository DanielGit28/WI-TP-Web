"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, getCurrentUser, githubSignInUrl } from "./api";
import type { CurrentUser } from "./types";

const TOKEN_KEY = "wi-tp:token";

interface AuthState {
  token: string | null;
  user: CurrentUser | null;
  /** True until the initial localStorage/me-lookup pass finishes. */
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      // Deferred a tick rather than set synchronously in the effect body —
      // avoids the extra cascading render the direct call would trigger.
      queueMicrotask(() => setIsLoading(false));
      return;
    }
    // Deferred a tick rather than set synchronously in the effect body —
    // avoids the extra cascading render the direct call would trigger.
    queueMicrotask(() => setToken(stored));

    getCurrentUser(stored)
      .then(setUser)
      .catch((err: unknown) => {
        // A real auth failure (expired/invalid JWT) — sign out for real.
        // Any other failure (404 because /users/me isn't deployed yet,
        // network error) just means no profile to show; the token is
        // still good for every other authenticated call.
        if (err instanceof ApiError && err.status === 401) {
          window.localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(() => {
    window.location.href = githubSignInUrl();
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: token !== null,
      signIn,
      signOut,
    }),
    [token, user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Called once by app/auth/callback/page.tsx after the OAuth redirect. */
export function storeTokenFromFragment(): string | null {
  const match = /(?:^|#)token=([^&]+)/.exec(window.location.hash);
  const raw = match?.[1];
  if (!raw) return null;
  const token = decodeURIComponent(raw);
  window.localStorage.setItem(TOKEN_KEY, token);
  return token;
}
