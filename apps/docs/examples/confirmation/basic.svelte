<script lang="ts">
  import type { Approval } from "@kind-ui/agent-ui";
  import type { ConfirmationDecision } from "@kind-ui/agent-ui/core";
  import { Confirmation } from "@/components/ui/svelte/confirmation/index.js";

  let approval: Approval = $state.raw({ approvalId: "delete", generation: 1, state: "requested" });
  const record = (approved: boolean, reason?: string) =>
    (approval = { ...approval, state: "responded", decision: { approved, ...(reason && { reason }) } });
</script>

<Confirmation
  label="Delete notes.md?"
  {approval}
  reason
  onApprove={() => record(true)}
  onDeny={({ reason }: ConfirmationDecision) => record(false, reason)}
/>
