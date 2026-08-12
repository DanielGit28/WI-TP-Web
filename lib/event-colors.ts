/**
 * Event-type color legend. Must stay in sync with the --color-* tokens in
 * app/globals.css — duplicated here (rather than read from CSS) because
 * WebGL/three.js can't consume CSS custom properties, and Tailwind can't
 * build a class name from a string that only exists at runtime (the
 * eventType from the API), so every place that colors an event by type
 * imports from here rather than trying to construct a Tailwind class.
 *
 * Keys match WebhookEvent.eventType exactly, as GitHub sends it (this repo
 * subscribes to every event via `events: ['*']` — see RepositoriesService).
 * Anything not in this map falls back to FALLBACK_COLOR.
 */
export const EVENT_COLORS: Record<string, string> = {
  push: "#4f8bff",
  pull_request: "#a371f7",
  issues: "#f2913d",
  star: "#ffd93d",
  release: "#35d07f",
  fork: "#ff6ec7",
  create: "#2fd4d4",
  delete: "#8b93a1",
};

export const FALLBACK_COLOR = "#6d7683";

export function colorForEventType(eventType: string): string {
  return EVENT_COLORS[eventType] ?? FALLBACK_COLOR;
}

/** Display order for legends and stats breakdowns — most common first. */
export const EVENT_TYPE_ORDER = [
  "push",
  "pull_request",
  "issues",
  "star",
  "release",
  "create",
  "fork",
  "delete",
];

const LABELS: Record<string, string> = {
  push: "push",
  pull_request: "pull_request",
  issues: "issues",
  star: "star",
  release: "release",
  fork: "fork",
  create: "create",
  delete: "delete",
};

export function labelForEventType(eventType: string): string {
  return LABELS[eventType] ?? eventType;
}
