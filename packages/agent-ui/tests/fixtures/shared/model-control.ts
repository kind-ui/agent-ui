import type { EffortLevel, ModelOption, SettingsEntry } from "@kind-ui/agent-ui";
import { logos } from "./model-logos.js";

const logoUrl = (markup: string) => `data:image/svg+xml,${encodeURIComponent(markup)}`;

export const models: ModelOption[] = [
  { id: "opus", name: "Claude Opus 5.5", group: "Anthropic", icon: logoUrl(logos.anthropic) },
  { id: "haiku", name: "Claude Haiku 5.5", group: "Anthropic", icon: logoUrl(logos.anthropic), efforts: [] },
  {
    id: "terra",
    name: "GPT-6.1 Terra",
    group: "OpenAI",
    icon: logoUrl(logos.openai),
    efforts: ["low", "medium"],
  },
];

export const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra High" },
  { value: "max", label: "Max" },
];

export const settings: SettingsEntry<string>[] = [
  { type: "toggle", id: "fast", label: "Fast mode" },
  {
    type: "choice",
    id: "context",
    label: "Context window",
    options: [
      { value: "200k", label: "200K" },
      { value: "1m", label: "1M" },
    ],
  },
];

export const modelActions = [{ id: "more", label: "More models" }];

export function controlHost() {
  const changes: { component: string; value: unknown; reason: string; source?: string }[] = [];
  const record = (component: string) => (value: unknown, details: { reason: string; source?: string }) =>
    changes.push({ component, value, reason: details.reason, source: details.source });
  return { host: { changes }, record };
}
