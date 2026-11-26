<!-- "Less", a swatch per level, "More". Hidden from assistive technology, which reads each day's count. -->
<script lang="ts">
  import type { ActivityGraphLegendState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Legend> = $props();
</script>

{#snippet fallback({ less, more, levels }: ActivityGraphLegendState)}<span>{less}</span
  >{#each levels as level (level.value)}<parts.Swatch value={level.value} />{/each}<span>{more}</span
  >{/snippet}

<parts.Legend {...props} children={children ?? fallback} />
