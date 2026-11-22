import type { Approval } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { Confirmation } from "@/components/ui/solid/confirmation";

export default function ConfirmationExample() {
  const [approval, setApproval] = createSignal<Approval>({
    approvalId: "delete",
    generation: 1,
    state: "requested",
  });
  const record = (approved: boolean, reason?: string) =>
    setApproval({ ...approval(), state: "responded", decision: { approved, ...(reason && { reason }) } });
  return (
    <Confirmation
      label="Delete notes.md?"
      approval={approval()}
      reason
      onApprove={() => record(true)}
      onDeny={(decision) => record(false, decision.reason)}
    />
  );
}
