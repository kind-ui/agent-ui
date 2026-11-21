<!--
  Calls `onApprove`. Reads the `approveLabel` unless you pass children. Rendered only while `onApprove` is set.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Approve> = $props();
</script>

<parts.Approve {...props}>
  {#snippet children(state: { label: string; pending: boolean })}
    {#if content}
      {@render content(state)}
    {:else}
      <!-- The mark shows only while the button's call is pending (controls.css). -->
      <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>
      {state.label}
    {/if}
  {/snippet}
</parts.Approve>
