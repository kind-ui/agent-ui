"use client";
import type { Approval } from "@kind-ui/agent-ui";
import { useState } from "react";
import { Terminal } from "@/components/ui/terminal";

const requested: Approval = { approvalId: "test", generation: 1, state: "requested" };

export default function TerminalApprovalExample() {
  const [approval, setApproval] = useState(requested);
  const [output, setOutput] = useState("");
  const record = (approved: boolean, reason?: string) => {
    setApproval({ ...approval, state: "responded", decision: { approved, ...(reason && { reason }) } });
    if (approved) setOutput("\x1b[32m✓\x1b[0m 22 tests passed");
  };
  return (
    <Terminal
      command="npm test"
      approval={approval}
      output={output}
      exitCode={output ? 0 : undefined}
      approvalReason
      onApprove={() => record(true)}
      onAlwaysAllow={() => record(true)}
      onDeny={({ reason }) => record(false, reason)}
      className="w-full max-w-xl"
    />
  );
}
