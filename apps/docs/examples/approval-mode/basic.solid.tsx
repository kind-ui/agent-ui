import type { ApprovalModeOption } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { ApprovalMode } from "@/components/ui/solid/approval-mode";

const modes: ApprovalModeOption[] = [
  { value: "ask", label: "Ask every time", description: "Approve each tool call" },
  { value: "edits", label: "Allow edits", description: "Edit files without asking" },
  { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
];

export default function ApprovalModeExample() {
  const [value, setValue] = createSignal("ask");

  return <ApprovalMode modes={modes} value={value()} onValueChange={setValue} learnMoreHref="#agent" />;
}
