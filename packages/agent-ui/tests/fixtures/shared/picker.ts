import type { PickerAction, PickerItem } from "@kind-ui/agent-ui";

// Lucide "folder", see THIRD_PARTY_NOTICES.md.
const folder = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
)}`;

/** Where to work: projects, one disabled, and a row that opens a page of branches with their ahead and behind counts. */
export const places: PickerItem<string>[] = [
  {
    value: "kind-ui/agent-ui",
    label: "kind-ui/agent-ui",
    description: "~/code/agent-ui",
    group: "Projects",
    icon: folder,
  },
  {
    value: "kind-ui/docs",
    label: "kind-ui/docs",
    description: "~/code/docs",
    group: "Projects",
    icon: folder,
  },
  { value: "kind-ui/registry", label: "kind-ui/registry", group: "Projects", icon: folder, disabled: true },
  {
    value: "branches",
    label: "Branches",
    description: "Work in a branch of agent-ui",
    group: "Branches",
    keywords: ["git"],
    items: [
      { value: "main", label: "main", meta: "↑0 ↓0" },
      { value: "picker", label: "picker", description: "Wave 5 Task 2", meta: "↑3 ↓1" },
      { value: "menus", label: "menus", meta: "↑1 ↓4" },
    ],
  },
];

export const placeActions: PickerAction<string>[] = [{ id: "new", label: "New project" }];

export function pickerHost() {
  const changes: { component: string; value: string | null; reason: string; source?: string }[] = [];
  const record =
    (component: string) => (value: string | null, details: { reason: string; source?: string }) =>
      changes.push({ component, value, reason: details.reason, source: details.source });
  return { host: { changes }, record };
}
