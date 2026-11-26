<!-- The event's `title`, then its status in words for screen readers, unless you pass children. -->
<script lang="ts">
  import type { RunTimelineTitleState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet fallback({ title, status }: RunTimelineTitleState)}{title}{#if status}<span data-run-timeline-status=""
      >{` (${status})`}</span
    >{/if}{/snippet}

<parts.Title {...props} children={children ?? fallback} />
