import type { TokenUsage } from "@kind-ui/agent-ui";

export const usage: TokenUsage = { input: 40_000, output: 12_000, reasoning: 5_600, cached: 20_000 };

export const context = { used: 57_600, total: 128_000, usage, cost: 0.42 };

export const levels = { normal: 57_600, high: 108_800, full: 124_000 } as const;

export function contextHost() {
  const changes: { open: boolean; reason: string; source: string }[] = [];
  const record = (open: boolean, details: { reason: string; source: string }) =>
    changes.push({ open, reason: details.reason, source: details.source });
  return { host: { changes }, record };
}
