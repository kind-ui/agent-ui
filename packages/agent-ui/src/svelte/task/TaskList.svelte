<!-- An item for each of the `items`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TaskItem from "./TaskItem.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.List> = $props();
</script>

<parts.List {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{#each state.items as item (item.id)}<TaskItem value={item.id}
      />{/each}{/if}{/snippet}</parts.List>
