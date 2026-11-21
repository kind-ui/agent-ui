<!--
  The threads as a navigation grid, grouped by pinned, the host's groups and date, with New chat above and one menu
  of Rename, Pin, Share and Delete for every row. Any `children` replace the default parts.
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

  let { id, render: own, children: content, ...props }: RootProps = $props();
</script>

<!--
  The `id` goes on the element, not the part: `@ui-sdk/svelte` keys a part by its `id`, and the agent bridge names a
  component only by a root without a key.
-->
<parts.Root {...props}>
  {#snippet render(handed: Parameters<NonNullable<RootProps["render"]>>[0])}
    {#if own}{@render own({ ...handed, props: { ...handed.props, id } })}{:else}
      <nav {...handed.props} {id}>{@render handed.children?.(handed.state)}</nav>
    {/if}
  {/snippet}
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}
      <ThreadListNew />
      <parts.Viewport>
        <ThreadListGrid />
        <ThreadListEnd />
      </parts.Viewport>
      <ThreadListMenu />
      <ThreadListDialog />
    {/if}
  {/snippet}
</parts.Root>
