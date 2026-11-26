<!--
  The threads as a navigation grid, grouped by pinned, the host's groups and date, or by status for an inbox of
  background runs, with New chat above and one menu of Rename, Pin, Mark as read, Share, Archive and Delete for every
  row. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ThreadListDialog from "./ThreadListDialog.svelte";
  import ThreadListEnd from "./ThreadListEnd.svelte";
  import ThreadListGrid from "./ThreadListGrid.svelte";
  import ThreadListMenu from "./ThreadListMenu.svelte";
  import ThreadListNew from "./ThreadListNew.svelte";

  type RootProps = ComponentProps<typeof parts.Root>;

  let { children: content, ...props }: RootProps = $props();
</script>

<parts.Root {...props}>
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}
      <ThreadListNew
      /><parts.Viewport>
        <ThreadListGrid
        /><ThreadListEnd />
      </parts.Viewport
      ><ThreadListMenu
      /><ThreadListDialog />
    {/if}
  {/snippet}
</parts.Root>
