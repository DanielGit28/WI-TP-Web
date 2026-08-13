"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colorForEventType, EVENT_TYPE_ORDER, labelForEventType } from "@/lib/event-colors";

const SIZE = 176;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function EventTypeRadial() {
  const { token } = useAuth();
  const query = useQuery({
    queryKey: ["events", "stats", token ?? null],
    queryFn: () => getEventStats(token ?? undefined),
    refetchInterval: 8000,
  });

  if (query.isLoading) {
    return <p className="text-sm text-text-faint">Loading stats…</p>;
  }
  if (query.isError || !query.data || query.data.length === 0) {
    return <p className="text-sm text-text-faint">No events ingested yet.</p>;
  }

  const rows = [...query.data].sort(
    (a, b) => EVENT_TYPE_ORDER.indexOf(a.eventType) - EVENT_TYPE_ORDER.indexOf(b.eventType),
  );
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  const fractions = rows.map((row) => (total > 0 ? row.count / total : 0));
  const segments = rows.map((row, i) => {
    // tsconfig's noUncheckedIndexedAccess makes this `number | undefined`
    // even though `i` is always in range here — fractions is derived from
    // the same `rows` array being mapped over.
    const fraction = fractions[i] ?? 0;
    const dash = fraction * CIRCUMFERENCE;
    const priorSum = fractions.slice(0, i).reduce((sum, f) => sum + f, 0);
    const offset = -priorSum * CIRCUMFERENCE;
    return { ...row, dash, offset, color: colorForEventType(row.eventType) };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${total} events across ${rows.length} event types`}
        className="shrink-0 -rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={STROKE}
        />
        {segments.map((s) => (
          <circle
            key={s.eventType}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={s.color}
            strokeWidth={STROKE}
            strokeDasharray={`${s.dash} ${CIRCUMFERENCE - s.dash}`}
            strokeDashoffset={s.offset}
          />
        ))}
        <text
          x={SIZE / 2}
          y={SIZE / 2 - 6}
          transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`}
          textAnchor="middle"
          className="fill-text-primary font-display text-[28px] font-semibold"
        >
          {total}
        </text>
        <text
          x={SIZE / 2}
          y={SIZE / 2 + 16}
          transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`}
          textAnchor="middle"
          className="fill-text-faint font-sans text-[10px]"
        >
          events · {rows.length} types
        </text>
      </svg>

      <div className="w-full min-w-0 flex-1 space-y-2">
        {segments.map((s) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <div key={s.eventType} className="flex items-center gap-3 text-sm">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span className="w-24 shrink-0 truncate font-mono text-xs text-text-secondary">
                {labelForEventType(s.eventType)}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: s.color }}
                />
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-xs text-text-secondary">
                {s.count}
              </span>
              <span className="w-9 shrink-0 text-right font-mono text-xs text-text-faint">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
