import type { ModelOption } from "@kind-ui/agent-ui";
import { logos } from "./model-logos.js";

export const models: ModelOption[] = [
  { id: "gpt-5", name: "GPT-5", group: "OpenAI", description: "Deep reasoning" },
  { id: "gpt-5-mini", name: "GPT-5 mini", group: "OpenAI" },
  { id: "sonnet-4", name: "Sonnet 4", group: "Anthropic", description: "Fast and capable" },
  { id: "opus-4", name: "Opus 4", group: "Anthropic", disabled: true },
  { id: "gemini-pro", name: "Gemini 2.5 Pro with a very long name", group: "Google" },
];

/** An image URL for a logo, as a host that serves its icons as files passes them. */
export const logoUrl = (markup: string) => `data:image/svg+xml,${encodeURIComponent(markup)}`;

/**
 * Models with logos, each made into an element by `toIcon`, but for Microsoft's, an image URL (its colors are its own,
 * since an image can't take `currentColor`), and one model without an icon. None has a description, so every row is
 * one line.
 */
export const iconModels = <Icon>(toIcon: (markup: string) => Icon): ModelOption<Icon | string>[] => [
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic", icon: toIcon(logos.anthropic) },
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: toIcon(logos.anthropic) },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: toIcon(logos.openai) },
  { id: "gpt-6-astra", name: "GPT-6 Astra", group: "OpenAI", icon: toIcon(logos.openai) },
  { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", group: "OpenAI", icon: toIcon(logos.openai) },
  { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", group: "OpenAI", icon: toIcon(logos.openai) },
  { id: "mai-code-2", name: "MAI Code 2", group: "Microsoft", icon: logoUrl(logos.microsoft) },
  { id: "gemini-4-argon", name: "Gemini 4 Argon", group: "Google", icon: toIcon(logos.gemini) },
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", group: "Google", icon: toIcon(logos.gemini) },
  { id: "grok-4.7", name: "Grok 4.7", group: "xAI", icon: toIcon(logos.xai) },
  { id: "local", name: "Local model", group: "Other" },
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
