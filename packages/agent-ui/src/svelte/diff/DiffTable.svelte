<!-- A `DiffRow` for each row in view, keyed by its index, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffRow from "./DiffRow.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Table> = $props();
</script>

<!-- Each row takes only its index, so a row that stays in view keeps its props as the rows around it change. -->
{#snippet fallback({ rows }: { rows: readonly { index: number }[] })}
  {#each rows.map((row) => row.index) as index (index)}<DiffRow {index} />{/each}
{/snippet}

<parts.Table {...props} children={children ?? fallback} />
