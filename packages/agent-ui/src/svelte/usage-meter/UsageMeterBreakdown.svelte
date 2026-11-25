<!-- A stacked bar of the `breakdown`, a segment per slice, unless you pass children. Rendered only with a breakdown. -->
<script lang="ts">
  import type { MeterSlice } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Breakdown> & { children?: Snippet<[{ slices: MeterSlice[] }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Breakdown {...props}>
  {#snippet children(state: { slices: MeterSlice[] })}
    {#if content}{@render content(state)}{:else}
      {#each state.slices as { id, width, color } (id)}<span data-slice={color} style:width></span>{/each}
    {/if}
  {/snippet}
</parts.Breakdown>
