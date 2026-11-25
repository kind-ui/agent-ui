<!-- Runs the call again through `onRetry`. Rendered while it's set and the status is `error`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.RetryButton> = $props();
</script>

<parts.RetryButton {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}Retry{/if}{/snippet}</parts.RetryButton>
