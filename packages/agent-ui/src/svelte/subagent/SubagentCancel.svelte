<!-- Calls `onCancel`. Reads "Stop" unless you pass children. Rendered only while the subagent can be stopped. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Cancel> = $props();
</script>

<parts.Cancel {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>Stop
    {/if}
  {/snippet}
</parts.Cancel>
