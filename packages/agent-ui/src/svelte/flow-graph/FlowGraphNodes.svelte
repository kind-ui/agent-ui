<!-- A node for each of the `nodes`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import FlowGraphNode from "./FlowGraphNode.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Nodes> = $props();
</script>

{#snippet fallback({ ids }: { ids: string[] })}
  {#each ids as id (id)}<FlowGraphNode value={id} />{/each}
{/snippet}

<parts.Nodes {...props} children={children ?? fallback} />
