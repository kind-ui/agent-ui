<!-- The chips that don't fit, one Tab stop with arrow keys between them. Without children, a `ContextBarItem` per row. -->
<script lang="ts">
  import type { ContextBarListState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import ContextBarItem from "./ContextBarItem.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.OverflowList> & { children?: Snippet<[ContextBarListState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.OverflowList {...props}>
  {#snippet children(state: ContextBarListState)}
    {#if content}{@render content(state)}{:else}
      {#each state.rows as row (row.item.id)}<ContextBarItem value={row.item.id} />{/each}
    {/if}
  {/snippet}
</parts.OverflowList>
