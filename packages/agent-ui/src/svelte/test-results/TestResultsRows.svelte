<!--
  A Tree row for each item: a suite holds its tests, and a failed test its `TestResultsFailure`. Every row has an
  indicator, a passed or skipped test's an empty spacer that lines its name up with the others. It's hidden from
  agents, which hides UI SDK's Tree from them while the rows stay the Test Results'. Rows are keyed by value, and core
  keeps an item while the host keeps its suite, so a streamed test updates only its suite's rows.
-->
<script lang="ts">
  import type { TreeItemData } from "@ui-sdk/svelte/tree";
  import {
    KindTreeGroup,
    KindTreeItem,
    KindTreeItemIndicator,
    KindTreeItemLabel,
  } from "../internal/tree/index.js";
  import TestResultsFailure from "./TestResultsFailure.svelte";
  import TestResultsItem from "./TestResultsItem.svelte";
  import TestResultsRows from "./TestResultsRows.svelte";

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
      ><TestResultsItem value={item.value} /></KindTreeItemLabel
    >{#if item.children}<KindTreeGroup
        >{#if item.children.length > 0}<TestResultsRows items={item.children} />{:else}<TestResultsFailure
            value={item.value}
          />{/if}</KindTreeGroup
      >{/if}</KindTreeItem
  >
{/each}
