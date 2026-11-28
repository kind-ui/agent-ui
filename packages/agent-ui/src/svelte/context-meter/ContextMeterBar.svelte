<!-- The breakdown as one stacked bar, with a tick at `compactAt`. One image, named by the breakdown as a sentence. -->
<script lang="ts">
  import type { ContextMeterBarState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Bar> & { children?: Snippet<[ContextMeterBarState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Bar {...props}>
  {#snippet children(state: ContextMeterBarState)}
    {#if content}{@render content(state)}{:else}{#each state.slices as slice (slice.id)}{#if slice.color}<span
            data-context-meter-segment=""
            data-color={slice.color}
            style:width={slice.width}></span
          >{/if}{/each}{/if}
  {/snippet}
</parts.Bar>
