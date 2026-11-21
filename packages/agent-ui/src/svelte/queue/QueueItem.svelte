<!-- The item whose `id` is `value`. Without children, it shows the item's mark, title, description and remove button. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import QueueItemDescription from "./QueueItemDescription.svelte";
  import QueueItemTitle from "./QueueItemTitle.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

<parts.Item {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.ItemIcon /><span data-text=""
        ><QueueItemTitle /><QueueItemDescription /></span
      ><parts.ItemRemove />{/if}{/snippet}</parts.Item>
