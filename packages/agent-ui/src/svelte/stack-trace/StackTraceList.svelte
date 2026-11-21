<!-- A frame for each app frame and a group for each run of library frames, unless you pass children. -->
<script lang="ts">
  import type { StackTraceRow } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import StackTraceFrame from "./StackTraceFrame.svelte";
  import StackTraceGroup from "./StackTraceGroup.svelte";

  let { children, ...props }: ComponentProps<typeof parts.List> = $props();

  const rowKey = (row: StackTraceRow) => (row.type === "frame" ? row.index : `library-${row.start}`);
</script>

{#snippet fallback({ rows }: { rows: StackTraceRow[] })}
  {#each rows as row (rowKey(row))}
    {#if row.type === "frame"}
      <StackTraceFrame value={String(row.index)} />
    {:else}
      <StackTraceGroup value={String(row.start)} />
    {/if}
  {/each}
{/snippet}

<parts.List {...props} children={children ?? fallback} />
