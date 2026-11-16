import type { ModelOption } from "@kind-ui/agent-ui";

export const models: ModelOption[] = [
  { id: "gpt-5", name: "GPT-5", group: "OpenAI", description: "Deep reasoning" },
  { id: "gpt-5-mini", name: "GPT-5 mini", group: "OpenAI" },
  { id: "sonnet-4", name: "Sonnet 4", group: "Anthropic", description: "Fast and capable" },
  { id: "opus-4", name: "Opus 4", group: "Anthropic", disabled: true },
  { id: "gemini-pro", name: "Gemini 2.5 Pro with a very long name", group: "Google" },
];

export const levels = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function selectionHost() {
  const changes: { component: string; value: string | null; reason: string }[] = [];
  const record = (component: string) => (value: string | null, details: { reason: string }) =>
    changes.push({ component, value, reason: details.reason });
  return { host: { changes }, record };
}
