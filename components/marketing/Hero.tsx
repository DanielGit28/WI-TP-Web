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

export function Hero() {
  const { signIn } = useAuth();
  const { particles, reducedMotion, handleParticleComplete } = usePipelineParticles();

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-text-faint">
          Webhook Ingestion &amp; Transformation Pipeline
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-text-primary sm:text-5xl">
          Every webhook, verified and normalized.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-text-muted">
          A live console for GitHub webhook deliveries: HMAC-verified, deduplicated, and
          normalized in real time. Watch every push, pull request, and release travel the
          pipeline as it happens.
        </p>
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

      <div className="h-[320px] overflow-hidden rounded-xl border border-border bg-surface-1 sm:h-[400px]">
        <PipelineCanvas
          particles={particles}
          onParticleComplete={handleParticleComplete}
          reducedMotion={reducedMotion}
        />
      </div>
    </section>
  );
}
