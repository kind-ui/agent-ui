<!-- The node whose `id` is `value`. Without children, it shows its status mark, label, kind and status. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import FlowGraphNodeDescription from "./FlowGraphNodeDescription.svelte";
  import FlowGraphNodeDetail from "./FlowGraphNodeDetail.svelte";
  import FlowGraphNodeLabel from "./FlowGraphNodeLabel.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Node> = $props();
</script>

{#snippet fallback()}
  <parts.NodeStatus /><FlowGraphNodeLabel /> <FlowGraphNodeDetail /><FlowGraphNodeDescription />
{/snippet}

<parts.Node {...props} children={children ?? fallback} />
