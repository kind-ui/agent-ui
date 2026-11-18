import type { EffortLevel } from "@kind-ui/agent-ui";

export const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
];

export function effortHost() {
  const changes: { component: string; value: string | null; reason: string; source?: string }[] = [];
  const record =
    (component: string) => (value: string | null, details: { reason: string; source?: string }) =>
      changes.push({ component, value, reason: details.reason, source: details.source });
  return { host: { changes }, record };
}
