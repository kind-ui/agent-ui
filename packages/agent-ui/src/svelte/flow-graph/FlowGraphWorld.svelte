<!-- Everything that pans and zooms: the edges and the nodes, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import FlowGraphEdges from "./FlowGraphEdges.svelte";
  import FlowGraphNodes from "./FlowGraphNodes.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.World> = $props();
</script>

{#snippet fallback()}
  <FlowGraphEdges /><FlowGraphNodes />
{/snippet}

<parts.World {...props} children={children ?? fallback} />
