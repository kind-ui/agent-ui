<script module lang="ts">
  export const variants = ["all", "reduced", "refusing", "unconfirmed", "learning"];
</script>

<script lang="ts">
  import type { ApprovalModeChangeReason } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { ApprovalMode } from "../../../../src/svelte/approval-mode/index.js";
  import { approvalModeHost, initialValue, learnMoreHref, modes } from "../../shared/approval-mode.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, change, learn } = approvalModeHost();
  expose({ kindHost: host });
  let value = $state(initialValue);
</script>

<div class="p-6">
  <ApprovalMode
    {modes}
    {value}
    {...variant === "learning" ? { onLearnMore: learn } : { learnMoreHref }}
    onValueChange={(next: string, details: ChangeDetails<ApprovalModeChangeReason>) => {
      change(next, details);
      if (variant === "refusing") details.cancel();
      else value = next;
    }}
    motion={variant === "reduced" ? "reduced" : undefined}
    agentConfirm={variant === "unconfirmed" ? false : undefined}
  />
</div>
