<!-- A running mark and "Compacting", in Compact's place while the conversation compacts. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Compacting> & { children?: Snippet<[{ text: string }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Compacting {...props}>
  {#snippet children(state: { text: string })}
    {#if content}{@render content(state)}{:else}<parts.CompactingIcon />{state.text}{/if}
  {/snippet}
</parts.Compacting>
