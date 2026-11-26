<script lang="ts">
  import type { Approval } from "@kind-ui/agent-ui";
  import type { ConfirmationDecision } from "@kind-ui/agent-ui/core";
  import { Terminal } from "@/components/ui/svelte/terminal/index.js";

  let approval: Approval = $state.raw({ approvalId: "test", generation: 1, state: "requested" });
  let output = $state("");
  const record = (approved: boolean, reason?: string) => {
    approval = { ...approval, state: "responded", decision: { approved, ...(reason && { reason }) } };
    if (approved) output = "\x1b[32m✓\x1b[0m 22 tests passed";
  };
</script>

<Terminal
  command="npm test"
  {approval}
  {output}
  exitCode={output ? 0 : undefined}
  approvalReason
  onApprove={() => record(true)}
  onAlwaysAllow={() => record(true)}
  onDeny={({ reason }: ConfirmationDecision) => record(false, reason)}
  class="w-full max-w-xl"
/>
