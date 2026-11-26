<!-- One SVG drawing every edge, unless you pass children. -->
<script lang="ts">
  import type { FlowEdgeEntry } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Edges> = $props();
</script>

{#snippet fallback({ paths }: { paths: FlowEdgeEntry[] })}
  {#each paths as path (path.id)}<path d={path.d} data-status={path.status} />{/each}
{/snippet}

<parts.Edges {...props} children={children ?? fallback} />
