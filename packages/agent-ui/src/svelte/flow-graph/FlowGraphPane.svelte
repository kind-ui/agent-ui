<!-- The scroll pane find in page scrolls, which pans the graph. Holds the world unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import FlowGraphWorld from "./FlowGraphWorld.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Pane> = $props();
</script>

{#snippet fallback()}<FlowGraphWorld />{/snippet}

<parts.Pane {...props} children={children ?? fallback} />
