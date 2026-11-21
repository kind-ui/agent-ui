<!-- A `TerminalLine` for each line in view, keyed by its index, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TerminalLine from "./TerminalLine.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Output> = $props();
</script>

<!-- Each line takes only its index, so a line that stays in view keeps its props as the rows around it change. -->
{#snippet fallback({ rows }: { rows: readonly { index: number }[] })}
  {#each rows.map((row) => row.index) as index (index)}<TerminalLine {index} />{/each}
{/snippet}

<parts.Output {...props} children={children ?? fallback} />
