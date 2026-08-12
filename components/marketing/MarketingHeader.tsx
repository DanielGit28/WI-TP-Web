"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function MarketingHeader() {
  const { signIn } = useAuth();

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm bg-push" aria-hidden="true" />
        <span className="font-display text-sm font-medium text-text-primary">WI-TP</span>
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-text-muted hover:text-text-secondary">
          View demo
        </Link>
        <button
          type="button"
          onClick={signIn}
          className="rounded-md bg-push px-3.5 py-1.5 text-sm font-medium text-surface-0 transition-opacity hover:opacity-90"
        >
          Continue with GitHub
        </button>
      </nav>
    </header>
  );
}
