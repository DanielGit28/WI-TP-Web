"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { usePipelineParticles } from "@/lib/usePipelineParticles";

// three.js/WebGL only exists in the browser — this must never render
// during SSR or the build fails trying to touch `window`.
const PipelineCanvas = dynamic(() => import("@/components/pipeline/PipelineCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-text-faint">
      Loading pipeline…
    </div>
  ),
});

const HIGHLIGHTS = ["HMAC-verified", "Deduplicated", "Cursor-paginated history"];

export function Hero() {
  const { signIn } = useAuth();
  const {
    particles,
    reducedMotion,
    handleParticleComplete,
    totalIngested,
    repoCount,
    isError,
    pollSeconds,
  } = usePipelineParticles({ poll: false });

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 78% 15%, rgba(79,139,255,0.14), transparent 60%), " +
            "radial-gradient(45% 45% at 12% 85%, rgba(163,113,247,0.12), transparent 60%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-text-faint">
            NestJS · Postgres · Cloud Run
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-text-primary sm:text-5xl">
            Every webhook, verified and normalized.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-text-muted">
            A live console for GitHub webhook deliveries: HMAC-verified, deduplicated, and
            normalized in real time. Watch every push, pull request, and release travel the
            pipeline as it happens.
          </p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h}
                className="rounded-full border border-border px-3 py-1 font-mono text-[11px] text-text-secondary"
              >
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={signIn}
              className="rounded-md bg-push px-4 py-2.5 text-sm font-medium text-surface-0 transition-opacity hover:opacity-90"
            >
              Continue with GitHub
            </button>
            <Link
              href="/dashboard"
              className="rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2"
            >
              View demo →
            </Link>
          </div>
          <p className="mt-3 text-xs text-text-faint">
            No account needed to look around — the demo shows real, live public data.
          </p>
        </div>

        <div className="relative z-0 isolate overflow-hidden rounded-xl border border-border bg-surface-1 shadow-[0_30px_80px_-30px_rgba(79,139,255,0.25)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] text-text-faint">
              {repoCount || "—"} repos · {totalIngested ?? "—"} events
            </span>
            <span className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isError ? "bg-danger" : "animate-pulse bg-success"
                }`}
                aria-hidden="true"
              />
              {isError ? "unreachable" : pollSeconds ? `live · ${pollSeconds}s poll` : "recent activity"}
            </span>
          </div>
          <div className="h-[320px] w-full overflow-x-auto sm:h-[420px]">
            <div className="h-full min-w-180 sm:min-w-240">
              <PipelineCanvas
                particles={particles}
                onParticleComplete={handleParticleComplete}
                reducedMotion={reducedMotion}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
