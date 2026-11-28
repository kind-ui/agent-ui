<!-- A row per slice of the breakdown: its swatch, label, tokens and share, then Free space. -->
<script lang="ts">
  import type { ContextMeterBarState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Breakdown> & { children?: Snippet<[ContextMeterBarState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Breakdown {...props}>
  {#snippet children(state: ContextMeterBarState)}
    {#if content}{@render content(state)}{:else}{#each state.slices as slice (slice.id)}<li data-color={slice.color}
        ><span data-context-meter-swatch="" aria-hidden="true"></span><span data-context-meter-label=""
            >{slice.label}</span
          ><span data-context-meter-tokens="">{slice.value}</span><span data-context-meter-share=""
            >{slice.percent}</span
          ></li
        >{/each}{/if}
  {/snippet}
</parts.Breakdown>
