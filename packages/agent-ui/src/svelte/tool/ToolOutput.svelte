<!--
  The output, once there is one: text as markdown, any other value as code. Labeled "Preliminary" until it's final,
  with its copy button, unless you pass children. The code block is named by the tool, like "search_docs output".
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { CodeBlock } from "../code-block/index.js";
  import { Markdown } from "../markdown/index.js";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Output> = $props();
</script>

<parts.Output {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <div data-tool-heading="">
        Output<span data-tool-badge="" data-kind-badge="">Preliminary</span><parts.OutputCopy />
      </div>
      {#if state.kind === "markdown"}
        <Markdown source={state.text} streaming={state.preliminary} highlight={state.highlight} />
      {:else}
        <CodeBlock
          aria-label={state.label}
          header={false}
          code={state.text}
          language="json"
          streaming={state.preliminary}
          highlight={state.highlight}
        />
      {/if}
    {/if}
  {/snippet}
</parts.Output>
