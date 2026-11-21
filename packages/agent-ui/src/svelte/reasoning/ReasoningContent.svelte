<!-- The `text` as markdown, streaming while the step runs, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Markdown } from "../markdown/index.js";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Content> = $props();
</script>

<parts.Content {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <Markdown source={state.text} streaming={state.streaming} />
    {/if}
  {/snippet}
</parts.Content>
