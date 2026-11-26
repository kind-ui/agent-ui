<script lang="ts">
  import type { Approval } from "@kind-ui/agent-ui";
  import type { HandoffStatus } from "@kind-ui/agent-ui/core";
  import { Handoff } from "@/components/ui/svelte/handoff/index.js";

  let approval: Approval = $state.raw({ approvalId: "billing", generation: 1, state: "requested" });
  let status: HandoffStatus = $state("pending");
  const record = (approved: boolean) => {
    approval = { ...approval, state: "responded", decision: { approved } };
    status = approved ? "accepted" : "declined";
  };
</script>

<Handoff
  from={{ id: "support", name: "Support" }}
  to={{ id: "billing", name: "Billing" }}
  reason="The customer asked for a refund on their last invoice"
  {status}
  {approval}
  onApprove={() => record(true)}
  onDeny={() => record(false)}
  class="w-full max-w-xl"
/>
