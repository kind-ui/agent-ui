<!-- The row of chips, one Tab stop with arrow keys between them. Without children, a `ContextBarChip` per row. -->
<script lang="ts">
  import type { ContextBarListState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import ContextBarChip from "./ContextBarChip.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.List> & { children?: Snippet<[ContextBarListState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.List {...props}>
  {#snippet children(state: ContextBarListState)}
    {#if content}{@render content(state)}{:else}
      {#each state.rows as row (row.item.id)}<ContextBarChip value={row.item.id} />{/each}
    {/if}
  {/snippet}
</parts.List>
