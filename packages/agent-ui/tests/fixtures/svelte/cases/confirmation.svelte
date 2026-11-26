<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";
  import { confirmationHost, moreConfirmations } from "../../shared/confirmation.js";

  export const variants = ["all", "reduced"];

  const { host, approve, deny, always } = confirmationHost();
  const more = moreConfirmations();

  export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script lang="ts">
  import type { Approval } from "@kind-ui/agent-ui";
  import { Confirmation } from "../../../../src/svelte/confirmation/index.js";
  import { request } from "../../shared/confirmation.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let approvals = $state.raw({ confirm: request("requested"), reason: request("requested") });

  expose({
    kindHost: host,
    kindApproval: {
      set: (next: Approval, id: "confirm" | "reason" = "confirm") => (approvals = { ...approvals, [id]: next }),
    },
  });
</script>

<div class="flex w-full max-w-[28rem] flex-col gap-4 p-6">
  <p id="above">Above</p
  ><Confirmation
    id="confirm"
    label="Run search_docs?"
    approval={approvals.confirm}
    onApprove={approve}
    onDeny={deny}
    motion={variant === "reduced" ? "reduced" : undefined}
  /><p id="below">Below</p
  ><Confirmation
    id="reason"
    label="Delete notes.md?"
    approval={approvals.reason}
    onApprove={approve}
    onDeny={deny}
    reason
  /><Confirmation id="approve-only" label="Open the link?" approval={request("requested")} onApprove={approve}
  /><Confirmation
    id="auto"
    label="Read README.md?"
    approval={request("auto", 1, { approved: true })}
    onApprove={approve}
    onDeny={deny}
  />{#each more as { id, options } (id)}<Confirmation
      {id}
      {...options}
      onApprove={approve}
      onDeny={deny}
      onAlwaysAllow={options.alwaysTarget ? always : undefined}
      motion={variant === "reduced" ? "reduced" : undefined}
    />{/each}
</div>
