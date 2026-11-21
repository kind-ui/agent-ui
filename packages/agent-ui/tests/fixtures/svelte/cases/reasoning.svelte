<script module lang="ts">
  export const variants = ["all"];
</script>

<script lang="ts">
  import type { ReasoningOptions } from "@kind-ui/agent-ui/core";
  import { Reasoning } from "../../../../src/svelte/reasoning/index.js";
  import { expose } from "../../shared/expose.js";

  type Row = Pick<ReasoningOptions, "status" | "durationSeconds" | "motion" | "label"> & { text: string };

  let rows: Record<string, Row> = $state.raw({
    live: { status: "running", text: "" },
    cached: { status: "pending", text: "Answered from the cache." },
    done: {
      status: "complete",
      durationSeconds: 3,
      text: "Compared **three** sources. Collapsed text: kumquat.",
    },
  });

  expose({
    kindReasoning: {
      set: (id: string, next: Partial<Row>) => (rows = { ...rows, [id]: { ...rows[id], ...next } as Row }),
      append: (id: string, chunk: string) =>
        (rows = { ...rows, [id]: { ...rows[id], text: `${rows[id]?.text}${chunk}` } as Row }),
    },
  });
</script>

<div class="flex w-96 flex-col gap-4 p-6">
  {#each Object.entries(rows) as [id, row] (id)}
    <Reasoning {id} {...row} />
  {/each}
</div>
