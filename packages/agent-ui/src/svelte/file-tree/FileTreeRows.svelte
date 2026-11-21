<!--
  A Tree row for each item, with a `FileTreeItem` in its label, and its children in a group. Every row has an
  indicator, a file's an empty spacer that lines its name up with a folder's. It's hidden from agents, which hides
  UI SDK's Tree from them (a component with a part under `data-agent-hidden` is off limits) while the rows stay the
  File Tree's.
-->
<script lang="ts">
  import type { TreeItemData } from "@ui-sdk/svelte/tree";
  import {
    KindTreeGroup,
    KindTreeItem,
    KindTreeItemIndicator,
    KindTreeItemLabel,
  } from "../internal/tree/index.js";
  import FileTreeItem from "./FileTreeItem.svelte";
  import FileTreeRows from "./FileTreeRows.svelte";

  let { items }: { items: TreeItemData[] } = $props();
</script>

{#each items as item (item.value)}
  <KindTreeItem value={item.value}
    ><KindTreeItemLabel
      ><KindTreeItemIndicator data-agent-hidden=""
        >{#if item.children}<!-- Lucide "chevron-right", see THIRD_PARTY_NOTICES.md. --><svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" /></svg
          >{/if}</KindTreeItemIndicator
      ><FileTreeItem value={item.value} /></KindTreeItemLabel
    >{#if item.children}<KindTreeGroup><FileTreeRows items={item.children} /></KindTreeGroup>{/if}</KindTreeItem
  >
{/each}
