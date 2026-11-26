<!-- The column headers, then a `DiffChange` or `DiffLine` for each row, keyed by its key, unless you pass children. -->
<script lang="ts">
  import type { DiffTableRow } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import DiffChange from "./DiffChange.svelte";
  import DiffColumn from "./DiffColumn.svelte";
  import DiffLine from "./DiffLine.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Table> = $props();
</script>

{#snippet fallback({ rows, columns }: { rows: readonly DiffTableRow[]; columns: readonly string[] })}<parts.Head
    >{#each columns as column (column)}<DiffColumn value={column} />{/each}</parts.Head
  >{#each rows as row (row.key)}{#if row.change}<DiffChange value={row.key} />{:else}<DiffLine
        value={row.key}
      />{/if}{/each}{/snippet}

<parts.Table {...props} children={children ?? fallback} />
