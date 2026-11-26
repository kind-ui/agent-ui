<!-- The last run's status mark and words, unless you pass a `children` snippet. Rendered only with a `lastRun`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ScheduleCardLastLink from "./ScheduleCardLastLink.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Last> = $props();
</script>

<!-- No whitespace between the mark and the link, so the words read as React's do. -->
{#snippet last()}<parts.LastMark /><ScheduleCardLastLink />{/snippet}

<parts.Last {...props} children={children ?? last} />
