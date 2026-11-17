import type { ApprovalModeOption } from "@kind-ui/agent-ui";

export const modes: ApprovalModeOption[] = [
  { value: "ask", label: "Ask every time", description: "Approve each tool call" },
  { value: "edits", label: "Allow edits", description: "Edit files without asking" },
  { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
];

export const initialValue = "ask";

export const learnMoreHref = "#approvals-help";

export function approvalModeHost() {
  const changes: { value: string; reason: string; source?: string }[] = [];
  return {
    host: { changes },
    change: (value: string, details: { reason: string; source?: string }) =>
      changes.push({ value, reason: details.reason, source: details.source }),
  };
}
