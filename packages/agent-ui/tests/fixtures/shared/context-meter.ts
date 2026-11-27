import type { TokenUsage, UsageLimit, UsageSlice } from "@kind-ui/agent-ui";

export const usage: TokenUsage = { input: 40_000, output: 12_000, reasoning: 5_600, cached: 20_000 };

export const context = { used: 57_600, total: 128_000, usage, cost: 0.42 };

export const levels = { normal: 57_600, high: 108_800, full: 124_000 } as const;

export function contextHost() {
  const changes: { open: boolean; reason: string; source: string }[] = [];
  const compacts: string[] = [];
  const record = (open: boolean, details: { reason: string; source: string }) =>
    changes.push({ open, reason: details.reason, source: details.source });
  // Pending until the test settles it, so "Compacting" shows meanwhile.
  let settle: (() => void) | undefined;
  const compact = (details: { source: string }) => {
    compacts.push(details.source);
    return new Promise<void>((resolve) => {
      settle = resolve;
    });
  };
  return { host: { changes, compacts, settleCompact: () => settle?.() }, record, compact };
}

export const breakdown: UsageSlice[] = [
  { id: "messages", label: "Messages", value: 41_200 },
  { id: "files", label: "Files", value: 18_100 },
  { id: "tools", label: "Tools", value: 9_800 },
  { id: "system", label: "System", value: 3_800 },
];

export const fillingUp: UsageSlice[] = [
  { id: "messages", label: "Messages", value: 74_200 },
  { id: "files", label: "Files", value: 23_000 },
  { id: "tools", label: "Tools", value: 9_100 },
  { id: "system", label: "System", value: 3_800 },
];

const HOUR = 3_600_000;
// Whole hours from now, so the words don't change while a test runs.
const hours = (count: number) => new Date((Math.floor(Date.now() / HOUR) + count) * HOUR).toISOString();

export const limits = (weekly = 24): UsageLimit[] => [
  {
    id: "five-hour",
    label: "5-hour limit",
    used: weekly > 80 ? 620 : 1_240,
    total: 2_000,
    resetsAt: hours(3),
    windowStartedAt: hours(-2),
  },
  {
    id: "weekly",
    label: "Weekly limit",
    used: weekly * 200,
    total: 20_000,
    resetsAt: hours(4 * 24),
    windowStartedAt: hours(-3 * 24),
  },
];

export const credits: UsageLimit = {
  id: "credits",
  label: "Credits",
  used: 20.5,
  total: 50,
  unit: "currency",
  resetsAt: hours(10 * 24),
};

const noCounts = { usage: undefined, cost: undefined };

/** Each page's options past the ring: the breakdown, the limits, inline, compacting. */
export const meterCases = {
  breakdown: { ...noCounts, used: 72_900, breakdown, compactAt: 0.8, defaultOpen: true },
  limits: { ...noCounts, used: 72_900, breakdown, compactAt: 0.8, limits: limits(), defaultOpen: true },
  "near-cap": { ...noCounts, used: 72_900, breakdown, limits: limits(82), defaultOpen: true },
  compacting: {
    ...noCounts,
    used: 110_100,
    breakdown: fillingUp,
    compactAt: 0.8,
    compacting: true,
    defaultOpen: true,
  },
  // A settings page's limits alone: no context window, so no summary.
  inline: {
    ...noCounts,
    used: 0,
    total: 0,
    onCompact: undefined,
    layout: "inline" as const,
    limits: [...limits(), credits],
  },
};
