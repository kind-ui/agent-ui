<!--
  The frame whose index is `value`. Without children, it shows the frame's function and location, inside a
  `StackTraceFrameOpen` while `onOpenFrame` is set.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import StackTraceFrameFunction from "./StackTraceFrameFunction.svelte";
  import StackTraceFrameLocation from "./StackTraceFrameLocation.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Frame> = $props();
</script>

{#snippet text()}<StackTraceFrameFunction /><StackTraceFrameLocation />{/snippet}

{#snippet fallback({ canOpen }: { canOpen: boolean })}
  {#if canOpen}
    <parts.FrameOpen>{@render text()}</parts.FrameOpen>
  {:else}
    {@render text()}
  {/if}
{/snippet}

<parts.Frame {...props} children={children ?? fallback} />
