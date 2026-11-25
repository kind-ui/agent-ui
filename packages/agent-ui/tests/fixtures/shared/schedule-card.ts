import type { Schedule } from "../../../src/types/index.js";

/** The clock the specs install: a Wednesday afternoon, UTC. */
export const scheduleNow = "2026-11-25T13:00:00Z";

export const triage: Schedule = {
  id: "triage",
  label: "Daily triage",
  description: "Weekdays at 9:00",
  enabled: true,
  nextRunAt: "2026-11-26T09:00:00Z",
  lastRun: { at: "2026-11-25T09:00:00Z", status: "complete", href: "#runs/41" },
};

export const schedules: Record<string, Schedule> = {
  all: triage,
  // Starts in half an hour from `scheduleNow`, so Next run counts down.
  soon: { ...triage, nextRunAt: "2026-11-25T13:30:00Z" },
  paused: {
    ...triage,
    enabled: false,
    lastRun: { at: "2026-11-24T09:00:00Z", status: "error", href: "#runs/40" },
  },
  // A link a host shouldn't render: it reads as text.
  unsafe: {
    ...triage,
    lastRun: { at: "2026-11-25T09:00:00Z", status: "complete", href: "javascript:alert(1)" },
  },
  new: { id: "digest", label: "Weekly digest", description: "Mondays at 8:00", enabled: true },
};

export type ScheduleCall = { action: string; value?: unknown; reason: string; source?: string };

/** Records what the card reports, and holds Run now pending until a spec settles it. */
export function scheduleCardHost() {
  let settle: { resolve(): void; reject(): void } | undefined;
  const host = {
    calls: [] as ScheduleCall[],
    resolve: () => settle?.resolve(),
    reject: () => settle?.reject(),
  };
  const record = (action: string, details: { reason: string; source?: string }, value?: unknown) =>
    host.calls.push({
      action,
      ...(value !== undefined && { value }),
      reason: details.reason,
      source: details.source,
    });
  const runNow = (details: { reason: string; source?: string }) => {
    record("runNow", details);
    return new Promise<void>((resolve, reject) => {
      settle = { resolve, reject };
    });
  };
  return { host, record, runNow };
}
