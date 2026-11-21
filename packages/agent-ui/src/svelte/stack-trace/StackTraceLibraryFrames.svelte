<!-- A group's frames, which open in place, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import StackTraceFrame from "./StackTraceFrame.svelte";

  let { children, ...props }: ComponentProps<typeof parts.LibraryFrames> = $props();
</script>

{#snippet fallback({ indexes }: { indexes: number[] })}
  {#each indexes as index (index)}
    <StackTraceFrame value={String(index)} />
  {/each}
{/snippet}

<parts.LibraryFrames {...props} children={children ?? fallback} />
