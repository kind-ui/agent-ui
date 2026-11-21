<!--
  Changed files as a folder tree: each file shows its change as a badge and its added and removed lines; a folder
  shows the most significant change inside it as a dot. The arrow keys, Home and End, and typing a name move between
  rows, as in UI SDK's Tree. Any `children` replace the rows inside the Tree; `FileTreeRows` draws them.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindTree } from "../internal/tree/index.js";
  import FileTreeRows from "./FileTreeRows.svelte";
  import { parts } from "./parts.js";

  let {
    children: content,
    value = $bindable(),
    expanded = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props} bind:value bind:expanded>
  {#snippet children(tree)}
    <KindTree
      controller={tree.controller}
      items={tree.items}
      defaultValue={tree.defaultValue}
      defaultExpanded={tree.defaultExpanded}
      aria-label={tree["aria-label"]}
      hiddenUntilFound={tree.hiddenUntilFound}
    >
      {#if content}
        {@render content(tree)}
      {:else}
        <FileTreeRows items={tree.items} />
      {/if}
    </KindTree>
  {/snippet}
</parts.Root>
