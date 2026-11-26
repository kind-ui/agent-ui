<!-- Calls `onRetry`. Reads "Retry" unless you pass children. Rendered only while a failed job can be retried. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Retry> = $props();
</script>

<parts.Retry {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>Retry{/if}{/snippet}</parts.Retry>
