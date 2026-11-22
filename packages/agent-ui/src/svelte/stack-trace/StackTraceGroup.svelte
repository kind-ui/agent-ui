<!--
  The library frames that start at the index `value`, folded into one row. Without children, it shows a
  `StackTraceLibrary` toggle and the frames.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import StackTraceLibrary from "./StackTraceLibrary.svelte";
  import StackTraceLibraryFrames from "./StackTraceLibraryFrames.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Group> = $props();
</script>

{#snippet fallback()}
  <StackTraceLibrary
  /><StackTraceLibraryFrames />
{/snippet}

<parts.Group {...props} children={children ?? fallback} />
