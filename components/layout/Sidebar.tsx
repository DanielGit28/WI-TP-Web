"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getEventStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Pipeline" },
  { href: "/stats", label: "Stats" },
  { href: "/repositories", label: "Repositories" },
  { href: "/deliveries", label: "Deliveries" },
];

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, token, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close the mobile drawer whenever navigation happens — queued so
  // the setState isn't textually synchronous inside the effect body
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    queueMicrotask(() => setIsOpen(false));
  }, [pathname]);

  // A real signal, not a fabricated one: whether our own poll of the API
  // is currently succeeding. No fake p99/uptime numbers — the backend
  // doesn't expose that yet, so this stays honest about what it knows.
  //
  // Same query key/fn as the stats consumers elsewhere (usePipelineParticles,
  // EventTypeRadial) so this shares their cached result instead of firing
  // its own redundant poll — the sidebar renders on every (app) page, so
  // without this it was doubling stats traffic on every one of them.
  const health = useQuery({
    queryKey: ["events", "stats", token ?? null],
    queryFn: () => getEventStats(token ?? undefined),
    refetchInterval: 15_000,
  });

  return (
    <>
      {/* Mobile top bar — normal document flow, only shown below md */}
      <div className="flex items-center justify-between border-b border-border bg-surface-1 px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-push" aria-hidden="true" />
          <span className="font-display text-sm font-medium text-text-primary">WI-TP</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-text-secondary"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Backdrop, mobile drawer only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* z-[70]: above the pipeline canvas's own isolated stacking context
          (see PipelineScene/Hero) — WebGL canvases and drei's Html overlays
          can otherwise composite above regular DOM content regardless of
          DOM order, so this needs to clearly outrank it, not just tie. */}
      <aside
        className={`fixed inset-y-0 left-0 z-70 flex h-full w-72 shrink-0 -translate-x-full flex-col border-r border-border bg-surface-1 px-4 py-5 transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${
          isOpen ? "translate-x-0" : ""
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-push" aria-hidden="true" />
            <span className="font-display text-sm font-medium text-text-primary">WI-TP</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-text-faint md:hidden"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-surface-3 text-text-primary"
                    : "text-text-muted hover:bg-surface-2 hover:text-text-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-xs">
          <p className="mb-1.5 font-medium text-text-faint uppercase tracking-wide">
            API health
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health.isError ? "bg-danger" : health.isSuccess ? "bg-success" : "bg-text-faint"
              }`}
              aria-hidden="true"
            />
            <span className="text-text-secondary">
              {health.isError ? "unreachable" : health.isSuccess ? "reachable" : "checking…"}
            </span>
          </div>
        </div>

        {isLoading ? null : isAuthenticated ? (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex min-w-0 items-center gap-2">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external GitHub avatar, not worth Image config for one small icon
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-6 w-6 shrink-0 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="h-6 w-6 shrink-0 rounded-full bg-surface-3" aria-hidden="true" />
              )}
              <span className="truncate text-xs text-text-secondary">
                {user?.githubLogin ?? "Signed in"}
              </span>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 text-xs text-text-faint hover:text-text-secondary"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={signIn}
            className="rounded-md border border-border-strong px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-2"
          >
            Continue with GitHub
          </button>
        )}
        </div>
      </aside>
    </>
  );
}
