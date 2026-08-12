import { EventTypeRadial } from "@/components/stats/EventTypeRadial";

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-wide text-text-faint">
          GET /events/stats
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-text-primary">
          Breakdown by event type
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Visibility-scoped — public repositories plus your own, same rule the feed uses.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-surface-1 p-6">
        <EventTypeRadial />
      </div>
    </div>
  );
}
