<!-- The days: the month labels over the weeks, then a row per weekday, its name and its days. -->
<script lang="ts">
  import type { ActivityGraphGridState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import ActivityGraphMonths from "./ActivityGraphMonths.svelte";
  import ActivityGraphWeekday from "./ActivityGraphWeekday.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Grid> = $props();
</script>

{#snippet fallback({ rows }: ActivityGraphGridState)}<ActivityGraphMonths
  />{#each rows as row (row.value)}<parts.Row value={row.value}
      ><ActivityGraphWeekday value={row.value} />{#each row.cells as cell (cell.value)}<parts.Cell
          value={cell.value}
          row={cell.row}
          col={cell.col}
        />{/each}</parts.Row
    >{/each}{/snippet}

<parts.Grid {...props} children={children ?? fallback} />
