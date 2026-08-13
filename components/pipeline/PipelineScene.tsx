"use client";

import dynamic from "next/dynamic";
import { usePipelineParticles } from "@/lib/usePipelineParticles";

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

export function PipelineScene() {
  const {
    particles,
    reducedMotion,
    handleParticleComplete,
    totalIngested,
    repoCount,
    isError,
    pollSeconds,
  } = usePipelineParticles();

  return (
    <div className="relative z-0 isolate overflow-hidden rounded-lg border border-border bg-surface-1">
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
              isError ? "bg-danger" : "animate-pulse bg-success"
            }`}
            aria-hidden="true"
          />
          {isError ? "polling paused" : pollSeconds ? `live · ${pollSeconds}s poll` : "recent activity"}
        </div>
      </div>

      {/* The 3D scene spans a fixed 12 world-unit width — below roughly a
          2:1 aspect ratio the end stages (GitHub/Postgres) get clipped by
          the camera's horizontal FOV. Rather than fight that with dynamic
          camera math, give the canvas a floor width and let narrow
          viewports scroll horizontally instead of squishing/cutting it. */}
      <div className="h-[320px] w-full overflow-x-auto sm:h-[380px]">
        <div className="h-full min-w-180 sm:min-w-215">
          <PipelineCanvas
            particles={particles}
            onParticleComplete={handleParticleComplete}
            reducedMotion={reducedMotion}
          />
        </div>
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
