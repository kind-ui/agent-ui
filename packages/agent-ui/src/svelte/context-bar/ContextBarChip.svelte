<!-- One chip in the bar: its icon, its label and a `ContextBarRemove`, unless you pass children. -->
<script lang="ts">
  import type { ContextBarChipState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import ChipContent from "./ChipContent.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Chip> & { children?: Snippet<[ContextBarChipState]> };

  let { value, children: content, ...props }: Props = $props();
</script>

<parts.Chip {value} {...props}>
  {#snippet children(state: ContextBarChipState)}
    {#if content}{@render content(state)}{:else}
      <ChipContent chip={state.chip}>
        {#snippet remove()}<parts.Remove {value} />{/snippet}
      </ChipContent>
    {/if}
  {/snippet}
</parts.Chip>
