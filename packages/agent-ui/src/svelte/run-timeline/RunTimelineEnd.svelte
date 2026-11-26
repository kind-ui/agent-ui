<!-- Show earlier while `hasMore`, else "Loading" while `busy`. -->
<script lang="ts">
  import type { RunTimelineEndState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import RunTimelineMore from "./RunTimelineMore.svelte";

  let { children, ...props }: ComponentProps<typeof parts.End> = $props();
</script>

{#snippet fallback({ canLoadMore }: RunTimelineEndState)}{#if canLoadMore}<RunTimelineMore />{:else}<span
      data-status-mark=""
      data-status="running"
      aria-hidden="true"
    ></span>Loading{/if}{/snippet}

<parts.End {...props} children={children ?? fallback} />
