import type { SuggestionItem } from "@kind-ui/agent-ui";

export const suggestions: SuggestionItem[] = [
  { id: "a", label: "Summarize this thread" },
  { id: "b", label: "Draft a reply", description: "Short and friendly" },
  { id: "c", label: "List the open questions" },
];

export const manySuggestions: SuggestionItem[] = [
  ...suggestions,
  { id: "d", label: "Find related issues" },
  { id: "e", label: "Explain the stack trace" },
  { id: "f", label: "Write release notes" },
  { id: "g", label: "Suggest a test plan" },
];

export const added: SuggestionItem = { id: "n", label: "Translate to French" };

export function suggestionHost() {
  const picks: { id: string; reason: string; source: string }[] = [];
  const record = (id: string, details: { reason: string; source: string }) =>
    picks.push({ id, reason: details.reason, source: details.source });
  const submits: string[] = [];
  return { host: { picks, submits }, record };
}
