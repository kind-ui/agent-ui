<!-- Calls `onCancel`. Reads "Cancel" unless you pass children. Rendered only while the job can be cancelled. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Cancel> = $props();
</script>

<parts.Cancel {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>Cancel{/if}{/snippet}</parts.Cancel>
