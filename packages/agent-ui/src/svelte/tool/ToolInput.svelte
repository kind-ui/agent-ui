<!--
  The input as code, labeled "Partial" while it streams, with its copy button, unless you pass children. The code
  block is named by the tool, like "search_docs input".
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { CodeBlock } from "../code-block/index.js";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Input> = $props();
</script>

<parts.Input {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <div data-tool-heading="">
        Input<span data-tool-badge="" data-kind-badge="">Partial</span><parts.InputCopy />
      </div>
      <CodeBlock
        aria-label={state.label}
        header={false}
        code={state.code}
        language="json"
        streaming={state.streaming}
        highlight={state.highlight}
      />
    {/if}
  {/snippet}
</parts.Input>
