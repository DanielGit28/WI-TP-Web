"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EventCard } from "./EventCard";

const POLL_MS = 8000;

export function EventFeed({ limit = 30 }: { limit?: number }) {
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ["events", "recent", token ?? null],
    queryFn: () => getEvents({ limit }, token ?? undefined),
    refetchInterval: POLL_MS,
  });

  if (query.isLoading) {
    return <p className="px-4 py-6 text-sm text-text-faint">Loading feed…</p>;
  }

  if (query.isError || !query.data) {
    return (
      <p className="px-4 py-6 text-sm text-text-faint">
        Couldn&apos;t reach the API. Retrying every {POLL_MS / 1000}s.
      </p>
    );
  }

  const events = query.data;

  if (events.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-text-secondary">Pipeline is idle.</p>
        <p className="mt-1 text-xs text-text-faint">
          No events yet. Register a repository, then push a commit or open a PR to see the
          first delivery travel through.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}
