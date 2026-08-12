"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getEvents, getPublicRepositories, getMyRepositories } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EVENT_TYPE_ORDER, labelForEventType } from "@/lib/event-colors";
import { EventCard } from "@/components/feed/EventCard";
import type { WebhookEvent } from "@/lib/types";

const PAGE_SIZE = 25;

export default function DeliveriesPage() {
  const { token } = useAuth();
  const [eventType, setEventType] = useState("");
  const [repository, setRepository] = useState("");

  const publicRepos = useQuery({ queryKey: ["repositories", "public"], queryFn: getPublicRepositories });
  const myRepos = useQuery({
    queryKey: ["repositories", "mine"],
    queryFn: () => getMyRepositories(token!),
    enabled: Boolean(token),
  });

  const repoOptions = useMemo(() => {
    const names = new Set<string>();
    (publicRepos.data ?? []).forEach((r) => names.add(r.fullName));
    (myRepos.data ?? []).forEach((r) => names.add(r.fullName));
    return Array.from(names).sort();
  }, [publicRepos.data, myRepos.data]);

  const query = useInfiniteQuery({
    queryKey: ["events", "deliveries", eventType, repository, token ?? null],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      getEvents(
        {
          limit: PAGE_SIZE,
          before: pageParam,
          eventType: eventType || undefined,
          repository: repository || undefined,
        },
        token ?? undefined,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: WebhookEvent[]) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPage[lastPage.length - 1]?.receivedAt,
  });

  const events = query.data?.pages.flat() ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-wide text-text-faint">
          GET /events — filtered, cursor-paginated
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-text-primary">
          Deliveries
        </h1>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-xs text-text-secondary focus:border-push focus:outline-none"
        >
          <option value="">All types</option>
          {EVENT_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {labelForEventType(t)}
            </option>
          ))}
        </select>

        <select
          value={repository}
          onChange={(e) => setRepository(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-xs text-text-secondary focus:border-push focus:outline-none"
        >
          <option value="">All repositories</option>
          {repoOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
        {query.isLoading ? (
          <p className="px-4 py-6 text-sm text-text-faint">Loading…</p>
        ) : events.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-faint">No deliveries match these filters.</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="mt-4 w-full rounded-md border border-border py-2 text-xs text-text-muted transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          {query.isFetchingNextPage ? "Loading…" : "Load older"}
        </button>
      )}
    </div>
  );
}
