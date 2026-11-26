<script lang="ts">
  import type { Approval } from "@kind-ui/agent-ui";
  import type { ConfirmationDecision } from "@kind-ui/agent-ui/core";
  import { Confirmation } from "@/components/ui/svelte/confirmation/index.js";

  let approval: Approval = $state.raw({ approvalId: "search", generation: 1, state: "requested" });
  const record = (decision: Approval["decision"]) => (approval = { ...approval, state: "responded", decision });
</script>

<Confirmation
  label="Allow `search_docs`?"
  {approval}
  alwaysTarget="search_docs"
  alwaysScope="in this project"
  alwaysDetail="Covers `search_docs` in this project. You can change it in Settings."
  onDeny={() => record({ approved: false })}
  onAlwaysAllow={({ scope }: ConfirmationDecision) => record({ approved: true, always: true, ...(scope && { scope }) })}
  onApprove={() => record({ approved: true })}
/>
