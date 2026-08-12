"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PipelineScene } from "@/components/pipeline/PipelineScene";
import { EventFeed } from "@/components/feed/EventFeed";
import { useAuth } from "@/lib/auth";
import { getMyRepositories } from "@/lib/api";

export default function DashboardPage() {
  const { token, isAuthenticated, signIn } = useAuth();

  const myRepos = useQuery({
    queryKey: ["repositories", "mine"],
    queryFn: () => getMyRepositories(token!),
    enabled: Boolean(token),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-wide text-text-faint">
          wi-tp-web · UI console
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-text-primary">Pipeline</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-muted">
          Screens built against the live API surface:{" "}
          <code className="font-mono text-text-secondary">GET /events</code>,{" "}
          <code className="font-mono text-text-secondary">GET /events/stats</code>,{" "}
          <code className="font-mono text-text-secondary">POST /repositories</code>. Event
          colors are a fixed legend, repeated identically in the pipeline, the feed, and stats.
        </p>
      </header>

      <div className="mb-6">
        <PipelineScene />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-lg border border-border bg-surface-1 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-sm font-medium text-text-primary">Live feed</h2>
            <Link href="/deliveries" className="text-xs text-push hover:underline">
              All deliveries →
            </Link>
          </div>
          <EventFeed limit={12} />
        </section>

        <aside className="rounded-lg border border-border bg-surface-1 p-4">
          {isAuthenticated ? (
            <>
              <h2 className="mb-3 font-display text-sm font-medium text-text-primary">
                Your repositories
              </h2>
              {myRepos.data && myRepos.data.length > 0 ? (
                <ul className="space-y-1.5">
                  {myRepos.data.slice(0, 5).map((repo) => (
                    <li key={repo.id} className="truncate font-mono text-xs text-text-secondary">
                      {repo.fullName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-faint">No repositories registered yet.</p>
              )}
              <Link
                href="/repositories"
                className="mt-3 inline-block text-xs text-push hover:underline"
              >
                Manage repositories →
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-display text-sm font-medium text-text-primary">
                Sign in with GitHub
              </h2>
              <p className="mt-1.5 text-xs text-text-muted">
                Register a repository to track its events. Public repos&apos; events are
                visible to everyone — private ones only to you.
              </p>
              <button
                type="button"
                onClick={signIn}
                className="mt-3 rounded-md bg-push px-3 py-1.5 text-xs font-medium text-surface-0 hover:opacity-90"
              >
                Continue with GitHub
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
