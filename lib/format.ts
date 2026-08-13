// API timestamps are UTC, but some serialization paths (e.g. a raw
// Postgres `timestamp` column read as text, rather than going through a
// proper Date transform) omit the trailing 'Z'/offset. A browser parses a
// date-time string with no timezone marker as *local* time, not UTC — so
// an event that really happened hours ago silently gets reinterpreted as
// having happened in the future (shifted by the browser's UTC offset),
// which is what was making every relative time clamp to "0s" regardless
// of how old the event actually was. Force UTC when no marker is present
// rather than trust the string's own claim.
export function parseApiDate(iso: string): Date {
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTimezone ? iso : `${iso}Z`);
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - parseApiDate(iso).getTime();
  const seconds = Math.max(0, Math.floor(ms / 1000));

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
