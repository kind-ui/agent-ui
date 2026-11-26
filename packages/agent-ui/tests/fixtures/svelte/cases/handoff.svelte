<script module lang="ts">
  export const variants = ["all"];
</script>

<script lang="ts">
  import type { HandoffOptions } from "@kind-ui/agent-ui/core";
  import { Handoff } from "../../../../src/svelte/handoff/index.js";
  import { confirmationHost } from "../../shared/confirmation.js";
  import { expose } from "../../shared/expose.js";
  import { handoffs } from "../../shared/handoff.js";

  const { host, approve, deny, always } = confirmationHost();
  let rows = $state.raw(handoffs);

  expose({
    kindHost: host,
    kindHandoff: {
      set: (id: string, next: Partial<HandoffOptions>) => {
        rows = { ...rows, [id]: { ...rows[id], ...next } };
      },
    },
  });
</script>

<div class="flex w-[34rem] flex-col gap-3 p-6">
  {#each Object.entries(rows) as [id, { approve: decides, ...row }] (id)}
    <Handoff
      {id}
      {...row}
      {...decides ? { onApprove: approve, onDeny: deny, onAlwaysAllow: always } : {}}
    />
  {/each}
</div>
