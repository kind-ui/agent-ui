<!--
  A read-only graph of agents, tools and people and the handoffs between them, laid out by dagre, that pans and
  zooms. Any `children` replace the default pane and controls.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import FlowGraphControls from "./FlowGraphControls.svelte";
  import FlowGraphPane from "./FlowGraphPane.svelte";
  import { parts } from "./parts.js";

  let { children, value = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}
  <FlowGraphPane /><FlowGraphControls />
{/snippet}

<parts.Root {...props} bind:value children={children ?? fallback} />
