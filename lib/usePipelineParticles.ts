"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents, getEventStats } from "@/lib/api";
import { colorForEventType } from "@/lib/event-colors";
import { useAuth } from "@/lib/auth";
import type { PipelineParticle } from "@/components/pipeline/PipelineCanvas";

const POLL_MS = 4000;
const FEED_LIMIT = 30;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Deferred a tick rather than set synchronously in the effect body —
    // avoids the extra cascading render the direct call would trigger.
    queueMicrotask(() => setReduced(mq.matches));
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return reduced;
}

/** Polls live events/stats and turns newly-arrived events into pipeline
 * particles. Shared by the dashboard's PipelineScene widget and the
 * marketing hero's ambient visual — both surfaces show the same live
 * data, just with different chrome around it. */
export function usePipelineParticles() {
  const { token } = useAuth();
  const reducedMotion = usePrefersReducedMotion();
  const [particles, setParticles] = useState<PipelineParticle[]>([]);
  const seenIds = useRef<Set<string> | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["events", "recent", token ?? null],
    queryFn: () => getEvents({ limit: FEED_LIMIT }, token ?? undefined),
    refetchInterval: POLL_MS,
  });

  const statsQuery = useQuery({
    queryKey: ["events", "stats", token ?? null],
    queryFn: () => getEventStats(token ?? undefined),
    refetchInterval: POLL_MS,
  });

  useEffect(() => {
    const events = eventsQuery.data;
    if (!events) return;

    if (seenIds.current === null) {
      // First successful load: remember what's already there, spawn
      // nothing — otherwise loading the page with 900 historical events
      // fires 900 particles at once.
      seenIds.current = new Set(events.map((e) => e.id));
      return;
    }

    const fresh = events.filter((e) => !seenIds.current!.has(e.id));
    if (fresh.length === 0) return;

    fresh.forEach((e) => seenIds.current!.add(e.id));

    if (reducedMotion) return; // still updates the feed/stats, just no particles

    setParticles((prev) => [
      ...prev,
      ...fresh.map((e) => ({ id: e.id, color: colorForEventType(e.eventType) })),
    ]);
  }, [eventsQuery.data, reducedMotion]);

  function handleParticleComplete(id: string) {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }

  const totalIngested = statsQuery.data?.reduce((sum, row) => sum + row.count, 0) ?? null;
  const repoCount = new Set(
    (eventsQuery.data ?? []).map((e) => e.repositoryName).filter(Boolean),
  ).size;

  return {
    particles,
    reducedMotion,
    handleParticleComplete,
    totalIngested,
    repoCount,
    isError: eventsQuery.isError,
    pollSeconds: POLL_MS / 1000,
  };
}
