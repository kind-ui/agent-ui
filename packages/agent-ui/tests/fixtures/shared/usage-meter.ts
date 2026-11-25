import type { UsageSlice } from "../../../src/types/index.js";

export const agents: UsageSlice[] = [
  { id: "planner", label: "Planner", value: 2.1 },
  { id: "coder", label: "Coder", value: 0.8 },
  { id: "reviewer", label: "Reviewer", value: 0.3 },
];

export const usage = { used: 3.2, limit: 5, period: "This month", breakdown: agents };

export const levels = { normal: 3.2, warning: 4.2, error: 5 } as const;

/** Three hours before `resetAt`, which specs install as the page's clock. */
export const reset = { resetAt: "2026-12-01T00:00:00Z", now: "2026-11-30T21:00:00Z" };

export const requests = {
  used: 120,
  limit: 500,
  unit: "requests",
  period: "Today",
  label: "Requests",
} as const;

/** What fills a Context Meter's window: it adds up to its `used`, 57,600 tokens. */
export const contextBreakdown: UsageSlice[] = [
  { id: "system", label: "System", value: 8_000 },
  { id: "tools", label: "Tools", value: 12_000 },
  { id: "messages", label: "Messages", value: 30_000 },
  { id: "files", label: "Files", value: 7_600 },
];

export function usageHost() {
  const changes: { open: boolean; reason: string; source: string }[] = [];
  const record = (open: boolean, details: { reason: string; source: string }) =>
    changes.push({ open, reason: details.reason, source: details.source });
  return { host: { changes }, record };
}
