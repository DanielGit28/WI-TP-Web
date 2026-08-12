const FEATURES = [
  {
    title: "Pipeline",
    endpoint: "GET /events · GET /events/stats",
    body: "A real WebGL visualization, not a static diagram. Every new delivery travels GitHub → Guard → Transform → Postgres as it's ingested, colored by event type.",
  },
  {
    title: "Stats",
    endpoint: "GET /events/stats",
    body: "A hand-built radial breakdown of ingested events by type, visibility-scoped to public repositories plus your own.",
  },
  {
    title: "Repositories",
    endpoint: "POST /repositories · GET /repositories/mine",
    body: "Register a repo and WI-TP installs the webhook automatically — no manual GitHub settings step. Public registry visible to everyone.",
  },
  {
    title: "Deliveries",
    endpoint: "GET /events",
    body: "The full history, filterable by event type and repository, cursor-paginated. Drill into any delivery for its raw JSON payload.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-lg border border-border bg-surface-1 p-5">
            <h3 className="font-display text-sm font-medium text-text-primary">{f.title}</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-text-faint">
              {f.endpoint}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
