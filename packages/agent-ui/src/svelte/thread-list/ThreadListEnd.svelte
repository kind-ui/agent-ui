<!-- After the rows while loading more: "Loading more chats", or "Couldn't load more chats" and Retry. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ThreadListRetry from "./ThreadListRetry.svelte";

  let { children, ...props }: ComponentProps<typeof parts.End> = $props();
</script>

{#snippet fallback({ status }: { status: "idle" | "loading" | "error" })}
  {#if status === "loading"}<span aria-hidden="true" data-status-mark="" data-status="running"></span>Loading more chats{:else}Couldn't load more chats<ThreadListRetry />{/if}
{/snippet}

<parts.End {...props} children={children ?? fallback} />
