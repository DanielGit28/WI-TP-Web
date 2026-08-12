import Link from "next/link";
import type { WebhookEvent } from "@/lib/types";
import { colorForEventType, labelForEventType } from "@/lib/event-colors";
import { timeAgo } from "@/lib/format";

export function EventCard({ event }: { event: WebhookEvent }) {
  const color = colorForEventType(event.eventType);

  return (
    <Link
      href={`/deliveries/${event.id}`}
      className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2"
    >
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] font-medium uppercase" style={{ color }}>
            {labelForEventType(event.eventType)}
          </span>
          <span className="truncate text-sm text-text-secondary">
            {event.summary ?? event.action ?? "event received"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-text-faint">
          {event.repositoryName ?? "unmatched repo"}
          {event.senderLogin ? ` · @${event.senderLogin}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-xs text-text-faint">{timeAgo(event.receivedAt)}</span>
    </Link>
  );
}
