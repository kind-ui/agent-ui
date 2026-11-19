import type { ContextChip } from "@kind-ui/agent-ui";

// Every label is longer than the 120px cap the fixture sets, so each chip is exactly 120px wide whatever the fonts:
// at 360px, two chips and "+N" fit.
export const contextChips = (count: number): ContextChip<string>[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `chip-${index}`,
    label: `src/components/conversation-view-${index}.tsx`,
    kind: "file",
  }));

export function contextHost() {
  const removes: { id: string; reason: string; source?: string }[] = [];
  const record = (id: string, details: { reason: string; source?: string }) =>
    removes.push({ id, reason: details.reason, source: details.source });
  return { host: { removes }, record };
}
