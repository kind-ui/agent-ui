<!--
  A calendar heat map of how much happened each day: weekdays down, weeks across, ending with today's. One Tab stop;
  the arrows move by day and week, and Enter calls `onSelect`. Any `children` replace its parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ActivityGraphLegend from "./ActivityGraphLegend.svelte";
  import ActivityGraphSummary from "./ActivityGraphSummary.svelte";
  import ActivityGraphViewport from "./ActivityGraphViewport.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<ActivityGraphViewport /><ActivityGraphLegend /><ActivityGraphSummary />{/snippet}

<parts.Root {...props} children={children ?? fallback} />
