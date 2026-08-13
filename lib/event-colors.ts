/**
 * Event-type color legend. The original 8 (push through delete) must stay
 * in sync with the --color-* tokens in app/globals.css, which a handful of
 * static Tailwind utility classes (bg-push, text-push, …) reference
 * elsewhere for fixed UI accents. Everything added after that block is
 * runtime-only — GitHub webhook event types beyond the original legend —
 * and intentionally has no CSS token counterpart, since nothing references
 * them via a static Tailwind class name (colorForEventType always returns
 * a raw hex string for inline styles, precisely because eventType is only
 * known at runtime).
 *
 * Keys match WebhookEvent.eventType exactly, as GitHub sends it (this repo
 * subscribes to every event via `events: ['*']` — see RepositoriesService),
 * so this list is deliberately broad rather than just the types one repo
 * happens to have seen so far. Anything still missing falls back to
 * FALLBACK_COLOR rather than breaking.
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

  // CI / Actions — the bulk of traffic on most active repos
  workflow_run: "#ff5c7a",
  workflow_job: "#ffb454",
  check_run: "#60d1ff",
  check_suite: "#8ce99a",
  status: "#e0a96d",
  deployment: "#56b6c2",
  deployment_status: "#7dd3fc",

  // Repo/webhook lifecycle & social
  ping: "#9aa5b8",
  watch: "#ffe27a",
  member: "#82aaff",
  public: "#89ddff",
  repository: "#c3cee3",

  // Comments & reviews
  issue_comment: "#ff9ad1",
  commit_comment: "#f6c177",
  pull_request_review: "#c792ea",
  pull_request_review_comment: "#b48ead",
  discussion: "#e5c07b",
  discussion_comment: "#dbbc7f",

  // Content
  gollum: "#c3e88d",
  label: "#ffcb6b",
  milestone: "#f78c6c",
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
  "workflow_run",
  "workflow_job",
  "check_run",
  "check_suite",
  "status",
  "deployment",
  "deployment_status",
  "ping",
  "watch",
  "member",
  "public",
  "repository",
  "issue_comment",
  "commit_comment",
  "pull_request_review",
  "pull_request_review_comment",
  "discussion",
  "discussion_comment",
  "gollum",
  "label",
  "milestone",
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
