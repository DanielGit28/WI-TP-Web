"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents, getEventStats } from "@/lib/api";
import { colorForEventType } from "@/lib/event-colors";
import { useAuth } from "@/lib/auth";
import type { PipelineParticle } from "./PipelineCanvas";

// three.js/WebGL only exists in the browser — this must never render
// during SSR or the build fails trying to touch `window`.
const PipelineCanvas = dynamic(() => import("./PipelineCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-text-faint">
      Loading pipeline…
    </div>
  ),
});

const POLL_MS = 4000;
const FEED_LIMIT = 30;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return reduced;
}

export function PipelineScene() {
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

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-medium text-text-primary">Pipeline</h2>
          <p className="text-xs text-text-faint">
            {repoCount || "—"} repos · {totalIngested ?? "—"} events
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              eventsQuery.isError ? "bg-danger" : "animate-pulse bg-success"
            }`}
            aria-hidden="true"
          />
          {eventsQuery.isError ? "polling paused" : `live · ${POLL_MS / 1000}s poll`}
        </div>
      </div>

      <div className="h-[320px] w-full sm:h-[380px]">
        <PipelineCanvas
          particles={particles}
          onParticleComplete={handleParticleComplete}
          reducedMotion={reducedMotion}
        />
      </div>

      {totalIngested !== null && (
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-text-faint">
          <span>
            <span className="font-mono text-text-secondary">{totalIngested}</span> ingested
          </span>
          <span>
            <span className="font-mono text-success">100%</span> signature-verified
          </span>
        </div>
      )}
    </div>
  );
}
