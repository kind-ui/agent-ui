<!-- Calls `onLoadMore`. Reads "Loading", and does nothing, while `busy`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.More> = $props();
</script>

{#snippet fallback({ busy }: { busy: boolean })}{#if busy}<span
      data-status-mark=""
      data-status="running"
      aria-hidden="true"
    ></span>Loading{:else}Show earlier{/if}{/snippet}

<parts.More {...props} children={children ?? fallback} />
