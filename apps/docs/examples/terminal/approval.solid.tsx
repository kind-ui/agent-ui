import type { Approval } from "@kind-ui/agent-ui";
import { createEffect, createSignal } from "solid-js";
import { Terminal } from "@/components/ui/solid/terminal";

const lines = ["> app@1.0.0 test\n", "✓ sign-in.test.ts (12 tests)\n", "✓ session.test.ts (9 tests)"];

export default function TerminalApprovalExample() {
  const [approval, setApproval] = createSignal<Approval>({
    approvalId: "test",
    generation: 1,
    state: "requested",
  });
  const [shown, setShown] = createSignal(0);
  const record = (decision: Approval["decision"]) =>
    setApproval({ ...approval(), state: "responded", decision });
  const running = () => approval().decision?.approved === true && shown() < lines.length;

  // Stands in for the command running once it's approved.
  createEffect(
    () => (running() ? shown() : undefined),
    (count) => {
      if (count === undefined) return;
      const timer = setTimeout(() => setShown(count + 1), 600);
      return () => clearTimeout(timer);
    },
  );

  const done = () => shown() === lines.length;
  return (
    <Terminal
      command="npm test"
      approval={approval()}
      output={lines.slice(0, shown()).join("")}
      exitCode={done() ? 0 : undefined}
      durationSeconds={done() ? 2 : undefined}
      alwaysTarget="npm test"
      alwaysScope="in this project"
      alwaysDetail="Covers commands starting with `npm test`, in this project."
      onDeny={() => record({ approved: false })}
      onAlwaysAllow={() => record({ approved: true, always: true })}
      onApprove={() => record({ approved: true })}
    />
  );
}
