<!-- The item whose `id` is `value`. Without children, it shows the item's mark, title and files. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TaskItemFiles from "./TaskItemFiles.svelte";
  import TaskItemTitle from "./TaskItemTitle.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

<parts.Item {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.ItemIcon
      /><TaskItemTitle
      /><TaskItemFiles
    />{/if}{/snippet}</parts.Item>
