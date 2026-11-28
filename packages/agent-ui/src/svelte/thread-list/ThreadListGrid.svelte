<!--
  A `ThreadListHeading`, `ThreadListRow` or `ThreadListFold` for each row in view, unless you pass children. The each block is keyed by
  row, so rows that didn't change aren't rendered again.
-->
<script lang="ts">
  import type { ThreadListGridState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";
  import ThreadListFold from "./ThreadListFold.svelte";
  import ThreadListHeading from "./ThreadListHeading.svelte";
  import ThreadListRow from "./ThreadListRow.svelte";

  type GridProps = ComponentProps<typeof parts.Grid>;
  type Props = { [K in keyof GridProps as K extends "children" ? never : K]: GridProps[K] } & {
    children?: Snippet<[ThreadListGridState]>;
  };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Grid {...props}>
  {#snippet children(state: ThreadListGridState)}
    {#if content}{@render content(state)}{:else}
      {#each state.visible as item (item.key)}
        {#if state.rows[item.index]?.type === "heading"}
          <ThreadListHeading value={String(item.key)} />
        {:else if state.rows[item.index]?.type === "fold"}
          <ThreadListFold value={String(item.key)} />
        {:else}
          <ThreadListRow value={String(item.key)} />
        {/if}
      {/each}
    {/if}
  {/snippet}
</parts.Grid>
