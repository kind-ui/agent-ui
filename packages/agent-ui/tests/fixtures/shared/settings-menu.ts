import type { SettingsEntry, SettingsValues } from "@kind-ui/agent-ui";

export const settings: SettingsEntry<string>[] = [
  { type: "toggle", id: "search", label: "Web search", description: "Look things up online" },
  { type: "toggle", id: "memory", label: "Memory" },
  {
    type: "choice",
    id: "style",
    label: "Response style",
    options: [
      { value: "concise", label: "Concise" },
      { value: "balanced", label: "Balanced" },
      { value: "detailed", label: "Detailed" },
    ],
  },
];

export const initialValues: SettingsValues = { memory: true, style: "balanced" };

export function settingsMenuHost() {
  const changes: { id: string; value: boolean | string; reason: string; source?: string }[] = [];
  return {
    host: { changes },
    change: (values: SettingsValues, details: { id: string; reason: string; source?: string }) =>
      changes.push({
        id: details.id,
        value: values[details.id] as boolean | string,
        reason: details.reason,
        source: details.source,
      }),
  };
}
