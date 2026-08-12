"use client";

import { useAuth } from "@/lib/auth";

/** Shown on every (app) page while signed out, so "view demo" visitors
 * always know why they're seeing public data only. Auth-gated actions
 * already degrade gracefully page-by-page (inline sign-in prompts) — this
 * just makes the framing explicit up front. */
export function DemoBanner() {
  const { isAuthenticated, isLoading, signIn } = useAuth();

  if (isLoading || isAuthenticated) return null;

  return (
    <div className="flex items-center justify-center gap-2 border-b border-border bg-surface-2 px-4 py-2 text-center text-xs text-text-muted">
      <span>Viewing public demo data.</span>
      <button
        type="button"
        onClick={signIn}
        className="font-medium text-push hover:underline"
      >
        Sign in with GitHub
      </button>
      <span>to register repositories and see your private events.</span>
    </div>
  );
}
