<!-- An item for each of the section's rows, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import QueueItem from "./QueueItem.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.List> = $props();
</script>

<parts.List {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{#each state.rows as row (row.item.id)}<QueueItem value={row.item.id}
      />{/each}{/if}{/snippet}</parts.List>
