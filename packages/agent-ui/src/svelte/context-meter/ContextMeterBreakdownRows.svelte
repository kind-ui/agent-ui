<!-- Each slice of the `breakdown` with its tokens and percent, unless you pass children. -->
<script lang="ts">
  import type { MeterSlice } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.BreakdownRows> & { children?: Snippet<[{ slices: MeterSlice[] }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.BreakdownRows {...props}>
  {#snippet children(state: { slices: MeterSlice[] })}
    {#if content}{@render content(state)}{:else}
      {#each state.slices as { id, label, value, percent, color } (id)}<div data-slice={color}
          ><dt>{label}</dt><dd>{value}</dd><dd>{percent}</dd></div
        >{/each}
    {/if}
  {/snippet}
</parts.BreakdownRows>
