<!-- Renders `source` as it streams in, with code blocks and tables. -->
<script lang="ts">
  import type { MarkdownState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import MarkdownBlock from "./MarkdownBlock.svelte";
  import { parts } from "./parts.js";

  let props: Omit<ComponentProps<typeof parts.Root>, "children"> = $props();
</script>

<parts.Root {...props}>
  {#snippet children({ blocks, highlight, streaming }: MarkdownState)}
    <!-- Keyed by place, not `block.key`, which changes with the streaming tail's text, so the tail updates in place. -->
    {#each blocks as block}
      <MarkdownBlock {block} {highlight} streaming={streaming && !block.final} />
    {/each}
  {/snippet}
</parts.Root>
