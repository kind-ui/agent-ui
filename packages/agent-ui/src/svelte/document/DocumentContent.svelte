<!--
  The `content` as its `format` says: Markdown, a Code Block without its header, or wrapped plain text, unless you
  pass children.
-->
<script lang="ts">
  import type { DocumentContentState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { CodeBlock } from "../code-block/index.js";
  import { Markdown } from "../markdown/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Content> = $props();
</script>

{#snippet fallback(state: DocumentContentState)}
  {#if state.format === "markdown"}
    <Markdown source={state.content} streaming={state.streaming} highlight={state.highlight} />
  {:else if state.format === "code"}
    <CodeBlock
      header={false}
      code={state.content}
      language={state.language}
      streaming={state.streaming}
      highlight={state.highlight}
    />
  {:else}
    <pre>{state.content}</pre>
  {/if}
{/snippet}

<parts.Content {...props} children={children ?? fallback} />
