"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents, getEventStats } from "@/lib/api";
import { colorForEventType, labelForEventType } from "@/lib/event-colors";
import { useAuth } from "@/lib/auth";
import type { PipelineParticle } from "@/components/pipeline/PipelineCanvas";
import type { WebhookEvent } from "@/lib/types";

const POLL_MS = 8000;
const FEED_LIMIT = 30;

// The pipeline stays alive between real live arrivals by continuously
// replaying the most recent real deliveries — not fake filler, actual
// recent activity, just visually subordinate to a genuinely-new one (see
// PipelineParticle.replay). Randomized delay rather than a fixed interval
// so it doesn't look like a metronome.
const REPLAY_POOL_SIZE = 10;
const REPLAY_MIN_DELAY_MS = 1400;
const REPLAY_MAX_DELAY_MS = 2600;

// Module-scope so the impure Date.now()/Math.random() calls aren't
// textually inside a hook body (same reasoning as PipelineCanvas's
// randomPulseKey — the react-hooks/purity rule flags impure calls
// wherever they're nested inside a component/hook's own source range).
function randomReplayId(): string {
  return `replay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function randomReplayDelay(): number {
  return REPLAY_MIN_DELAY_MS + Math.random() * (REPLAY_MAX_DELAY_MS - REPLAY_MIN_DELAY_MS);
}

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
 * data, just with different chrome around it.
 *
 * Two particle tiers keep the pipe feeling alive without conflating "just
 * happened" with "recent history": genuinely new deliveries spawn a full-
 * brightness particle (spawn toast, stage pulses, the works); between
 * those, a steady trickle replays a random pick from the last
 * REPLAY_POOL_SIZE real events, colored correctly but visually dimmer —
 * real activity, just not literally live right now.
 *
 * `poll: false` fetches once and never refetches — for surfaces like the
 * anonymous marketing hero, where the visual is decorative ambiance, not a
 * live console someone is actively watching, continuous polling from every
 * anonymous visitor's browser isn't worth the request volume. */
export function usePipelineParticles(options?: { poll?: boolean }) {
  const poll = options?.poll ?? true;
  const { token } = useAuth();
  const reducedMotion = usePrefersReducedMotion();
  const [particles, setParticles] = useState<PipelineParticle[]>([]);
  const seenIds = useRef<Set<string> | null>(null);
  const recentEventsRef = useRef<WebhookEvent[]>([]);

  const eventsQuery = useQuery({
    queryKey: ["events", "recent", token ?? null],
    queryFn: () => getEvents({ limit: FEED_LIMIT }, token ?? undefined),
    refetchInterval: poll ? POLL_MS : false,
  });

  const statsQuery = useQuery({
    queryKey: ["events", "stats", token ?? null],
    queryFn: () => getEventStats(token ?? undefined),
    refetchInterval: poll ? POLL_MS : false,
  });

  useEffect(() => {
    recentEventsRef.current = eventsQuery.data ?? [];
  }, [eventsQuery.data]);

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
      ...fresh.map((e) => ({
        id: e.id,
        color: colorForEventType(e.eventType),
        label: labelForEventType(e.eventType),
      })),
    ]);
  }, [eventsQuery.data, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    let timeout: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function scheduleNext() {
      timeout = setTimeout(() => {
        if (cancelled) return;
        const pool = recentEventsRef.current.slice(0, REPLAY_POOL_SIZE);
        if (pool.length > 0) {
          // Non-null: pool.length > 0 was just checked, so this index is
          // always in range — noUncheckedIndexedAccess can't see that
          // across the Math.floor/random call.
          const event = pool[Math.floor(Math.random() * pool.length)]!;
          setParticles((prev) => [
            ...prev,
            { id: randomReplayId(), color: colorForEventType(event.eventType), replay: true },
          ]);
        }
        scheduleNext();
      }, randomReplayDelay());
    }
    scheduleNext();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [reducedMotion]);

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
    pollSeconds: poll ? POLL_MS / 1000 : null,
  };
}
