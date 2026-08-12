"use client";

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

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();

  // A real signal, not a fabricated one: whether our own poll of the API
  // is currently succeeding. No fake p99/uptime numbers — the backend
  // doesn't expose that yet, so this stays honest about what it knows.
  const health = useQuery({
    queryKey: ["health-ping"],
    queryFn: () => getEventStats(),
    refetchInterval: 15_000,
    retry: false,
  });

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface-1 px-4 py-5">
      <Link href="/" className="mb-6 flex items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-push" aria-hidden="true" />
        <span className="font-display text-sm font-medium text-text-primary">WI-TP</span>
      </Link>

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
  );
}
