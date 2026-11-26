<!-- A badge for each of the agent's `capabilities`, unless you pass children. Rendered only with some. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Capabilities> = $props();
</script>

{#snippet badges({ capabilities }: { capabilities: readonly string[] })}{#each capabilities as capability (capability)}<parts.Capability
      value={capability}>{capability}</parts.Capability
    >{/each}{/snippet}

<parts.Capabilities {...props} children={children ?? badges} />
