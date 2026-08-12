"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { findEventById } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colorForEventType, labelForEventType } from "@/lib/event-colors";

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ["events", "detail", id, token ?? null],
    queryFn: () => findEventById(id, token ?? undefined),
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/deliveries" className="text-xs text-push hover:underline">
        ← All deliveries
      </Link>

      {query.isLoading && <p className="mt-6 text-sm text-text-faint">Loading…</p>}

      {query.isSuccess && query.data === null && (
        <p className="mt-6 text-sm text-text-faint">
          Delivery not found — it may be older than the last 200 events, or on a private repo
          you don&apos;t have access to.
        </p>
      )}

      {query.data && (
        <div className="mt-4 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase"
                style={{
                  color: colorForEventType(query.data.eventType),
                  backgroundColor: `color-mix(in srgb, ${colorForEventType(query.data.eventType)} 16%, transparent)`,
                }}
              >
                {labelForEventType(query.data.eventType)}
              </span>
              {query.data.action && (
                <span className="text-xs text-text-faint">{query.data.action}</span>
              )}
            </div>
            <h1 className="mt-2 font-display text-xl font-medium text-text-primary">
              {query.data.summary ?? "Event received"}
            </h1>
            <p className="mt-1 font-mono text-xs text-text-faint">
              {query.data.repositoryName ?? "unmatched repo"}
              {query.data.senderLogin ? ` · @${query.data.senderLogin}` : ""}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-surface-1 p-4 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-text-faint">delivery_id</dt>
              <dd className="mt-0.5 truncate font-mono text-text-secondary">
                {query.data.deliveryId}
              </dd>
            </div>
            <div>
              <dt className="text-text-faint">ref_name</dt>
              <dd className="mt-0.5 font-mono text-text-secondary">
                {query.data.refName ?? "null"}
              </dd>
            </div>
            <div>
              <dt className="text-text-faint">signature</dt>
              <dd className="mt-0.5 font-mono text-success">sha256 verified ✓</dd>
            </div>
            <div>
              <dt className="text-text-faint">received_at</dt>
              <dd className="mt-0.5 font-mono text-text-secondary">
                {new Date(query.data.receivedAt).toISOString()}
              </dd>
            </div>
          </dl>

          <div>
            <p className="mb-1.5 font-mono text-xs uppercase tracking-wide text-text-faint">
              raw_payload
            </p>
            <pre className="max-h-[480px] overflow-auto rounded-lg border border-border bg-surface-2 p-4 font-mono text-xs leading-relaxed text-text-secondary">
              {JSON.stringify(query.data.rawPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
