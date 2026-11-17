import type { MenuEntry } from "@kind-ui/agent-ui";

// Lucide "upload" and "file-text", see THIRD_PARTY_NOTICES.md.
const icon = (path: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`,
  )}`;
const upload = icon(
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
);
const file = icon(
  '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
);

export const addItems: MenuEntry<string>[] = [
  { id: "upload", label: "Upload file", description: "Images, PDFs and code", icon: upload },
  { id: "context", label: "Add context", description: "Files from this project", icon: file },
  { id: "screenshot", label: "Screenshot", disabled: true },
  {
    id: "github",
    label: "GitHub",
    group: "Plugins",
    items: [
      { id: "issue", label: "Add an issue" },
      { id: "pull", label: "Add a pull request" },
    ],
  },
  { id: "linear", label: "Linear", group: "Plugins", items: [{ id: "ticket", label: "Add a ticket" }] },
];

export function addMenuHost() {
  const actions: { id: string; reason: string; source?: string }[] = [];
  const opens: { open: boolean; reason: string }[] = [];
  return {
    host: { actions, opens },
    action: (id: string, details: { reason: string; source?: string }) =>
      actions.push({ id, reason: details.reason, source: details.source }),
    open: (open: boolean, details: { reason: string }) => opens.push({ open, reason: details.reason }),
  };
}
