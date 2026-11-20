import type { Thread } from "@kind-ui/agent-ui";

export const NOW = "2026-11-18T09:00:00Z";

const named: Thread[] = [
  {
    id: "launch",
    title: "Plan the launch",
    updatedAt: "2026-11-18T08:10:00Z",
    pinned: true,
    snippet: "Dates and owners",
  },
  { id: "login", title: "Fix the login redirect", updatedAt: "2026-11-18T07:00:00Z", status: "running" },
  {
    id: "pricing",
    title: "Pricing page copy",
    updatedAt: "2026-11-17T16:00:00Z",
    snippet: "Three tiers, yearly billing",
  },
  {
    id: "roadmap",
    title: "Q1 roadmap",
    updatedAt: "2026-11-02T10:00:00Z",
    group: "Team",
    status: "awaiting-input",
  },
  { id: "invoices", title: "Export invoices to CSV", updatedAt: "2026-11-14T12:00:00Z" },
  {
    id: "recipes",
    title: "Weeknight recipes",
    updatedAt: "2026-10-03T19:00:00Z",
    snippet: "Something with lentils",
  },
];

// Older threads, so the newest 20 leave some out until a search finds them.
const older: Thread[] = Array.from({ length: 19 }, (_, index) => ({
  id: `old-${index + 1}`,
  title: `Old note ${index + 1}`,
  updatedAt: `2025-0${(index % 9) + 1}-1${index % 10}T12:00:00Z`,
}));

export const threads: Thread[] = [
  ...named,
  ...older,
  { id: "archive", title: "Archived lentil soup", updatedAt: "2024-03-01T12:00:00Z" },
];

/** What the host's own search returns, in its order, for `filter: false`. */
export const results: Thread[] = [named[4], named[0], named[2]] as Thread[];

export function threadSearchHost() {
  const calls: { name: string; value: string; reason: string; source?: string }[] = [];
  const record =
    (name: string, cancel = false) =>
    (value: string, details: { reason: string; source?: string; cancel?: () => void }) => {
      calls.push({ name, value, reason: details.reason, source: details.source });
      if (cancel) details.cancel?.();
    };
  return { host: { calls }, record };
}
