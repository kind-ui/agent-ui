import type { Approval } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { Terminal } from "@/components/ui/solid/terminal";

export default function TerminalApprovalExample() {
  const [approval, setApproval] = createSignal<Approval>({
    approvalId: "test",
    generation: 1,
    state: "requested",
  });
  const [output, setOutput] = createSignal("");
  const record = (approved: boolean, reason?: string) => {
    setApproval({ ...approval(), state: "responded", decision: { approved, ...(reason && { reason }) } });
    if (approved) setOutput("\x1b[32m✓\x1b[0m 22 tests passed");
  };
  return (
    <Terminal
      command="npm test"
      approval={approval()}
      output={output()}
      exitCode={output() ? 0 : undefined}
      approvalReason
      onApprove={() => record(true)}
      onAlwaysAllow={() => record(true)}
      onDeny={(decision) => record(false, decision.reason)}
      class="w-full max-w-xl"
    />
  );
}
