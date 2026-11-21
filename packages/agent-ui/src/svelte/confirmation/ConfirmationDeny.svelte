<!--
  Calls `onDeny`. With `reason`, a person's first press opens the reason box instead. Reads the `denyLabel` unless
  you pass children. Rendered only while `onDeny` is set.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Deny> = $props();
</script>

<parts.Deny {...props}>
  {#snippet children(state: { label: string; pending: boolean })}
    {#if content}
      {@render content(state)}
    {:else}
      <!-- The mark shows only while the button's call is pending (controls.css). -->
      <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>
      {state.label}
    {/if}
  {/snippet}
</parts.Deny>
