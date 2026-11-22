<!-- One chip in the list of the rest, as `ContextBarChip` is in the bar, with a `ContextBarItemRemove`. -->
<script lang="ts">
  import type { ContextBarChipState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import ChipContent from "./ChipContent.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Item> & { children?: Snippet<[ContextBarChipState]> };

  let { value, children: content, ...props }: Props = $props();
</script>

<parts.Item {value} {...props}>
  {#snippet children(state: ContextBarChipState)}
    {#if content}{@render content(state)}{:else}
      <ChipContent chip={state.chip}>
        {#snippet remove()}<parts.ItemRemove {value} />{/snippet}
      </ChipContent>
    {/if}
  {/snippet}
</parts.Item>
