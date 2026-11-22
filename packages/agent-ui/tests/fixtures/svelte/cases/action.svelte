<script module lang="ts">
  export const variants = ["all", "owned"];
</script>

<script lang="ts">
  import type { ActionOptions } from "@kind-ui/agent-ui/core";
  import { Action } from "../../../../src/svelte/action/index.js";
  import { expose } from "../../shared/expose.js";

  type Row = Pick<ActionOptions, "status" | "result" | "open">;

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const owned = $derived(variant === "owned");
  const host = { openings: [] as unknown[][] };
  let row: Row = $state({ status: "running", result: "" });

  expose({
    kindHost: host,
    kindAction: {
      set: (next: Partial<Row>) => (row = { ...row, ...next }),
      append: (chunk: string) => (row = { ...row, result: `${row.result}${chunk}` }),
    },
  });

  const onOpenChange: NonNullable<ActionOptions["onOpenChange"]> = (open, details) => {
    host.openings.push([open, details.reason]);
  };
</script>

<div class="flex w-96 flex-col gap-4 p-6">
  {#if owned}
    <!-- An owner refuses every change through a function binding: `open` moves only when it sets it. -->
    <Action
      id="action"
      label="Explain"
      quote={"Rate limits reset every hour.\n\n"}
      status={row.status}
      result={row.result}
      bind:open={() => row.open ?? true, () => {}}
      {onOpenChange}
    />
  {:else}
    <Action
      id="action"
      label="Explain"
      quote={"Rate limits reset every hour.\n\n"}
      status={row.status}
      result={row.result}
    />
  {/if}
</div>
