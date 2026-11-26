import type { Approval } from "@kind-ui/agent-ui";
import type { HandoffStatus } from "@kind-ui/agent-ui/core";
import { createSignal } from "solid-js";
import { Handoff } from "@/components/ui/solid/handoff";

export default function HandoffExample() {
  const [approval, setApproval] = createSignal<Approval>({
    approvalId: "billing",
    generation: 1,
    state: "requested",
  });
  const [status, setStatus] = createSignal<HandoffStatus>("pending");
  const record = (approved: boolean) => {
    setApproval({ ...approval(), state: "responded", decision: { approved } });
    setStatus(approved ? "accepted" : "declined");
  };
  return (
    <Handoff
      from={{ id: "support", name: "Support" }}
      to={{ id: "billing", name: "Billing" }}
      reason="The customer asked for a refund on their last invoice"
      status={status()}
      approval={approval()}
      onApprove={() => record(true)}
      onDeny={() => record(false)}
      class="w-full max-w-xl"
    />
  );
}
