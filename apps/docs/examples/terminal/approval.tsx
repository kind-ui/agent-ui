"use client";
import type { Approval } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Terminal } from "@/components/ui/terminal";

const lines = ["> app@1.0.0 test\n", "✓ sign-in.test.ts (12 tests)\n", "✓ session.test.ts (9 tests)"];

export default function TerminalApprovalExample() {
  const [approval, setApproval] = useState<Approval>({
    approvalId: "test",
    generation: 1,
    state: "requested",
  });
  const [shown, setShown] = useState(0);
  const record = (decision: Approval["decision"]) =>
    setApproval({ ...approval, state: "responded", decision });
  const running = approval.decision?.approved === true && shown < lines.length;

  // Stands in for the command running once it's approved.
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setShown(shown + 1), 600);
    return () => clearTimeout(timer);
  }, [running, shown]);

  const done = shown === lines.length;
  return (
    <Terminal
      command="npm test"
      approval={approval}
      output={lines.slice(0, shown).join("")}
      {...(done && { exitCode: 0, durationSeconds: 2 })}
      alwaysTarget="npm test"
      alwaysScope="in this project"
      alwaysDetail="Covers commands starting with `npm test`, in this project."
      onDeny={() => record({ approved: false })}
      onAlwaysAllow={() => record({ approved: true, always: true })}
      onApprove={() => record({ approved: true })}
    />
  );
}
