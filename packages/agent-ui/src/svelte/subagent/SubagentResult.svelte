<!-- The `result` as markdown, unless you pass children. Rendered only once the status is `complete`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Markdown } from "../markdown/index.js";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Result> = $props();
</script>

<parts.Result {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else if state.result}
      <Markdown source={state.result} />
    {/if}
  {/snippet}
</parts.Result>
