<!-- One line of output, its `index`th, as styled spans, unless you pass children. -->
<script lang="ts">
  import type { AnsiSpan } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, value, ...props }: ComponentProps<typeof parts.Line> = $props();
</script>

{#snippet fallback({ spans }: { spans: readonly AnsiSpan[] })}
  {#each spans as span}<span
      style:color={span.fg}
      style:background-color={span.bg}
      data-bold={span.bold ? "" : undefined}
      data-dim={span.dim ? "" : undefined}
      data-italic={span.italic ? "" : undefined}
      data-underline={span.underline ? "" : undefined}
      data-strike={span.strike ? "" : undefined}>{span.text}</span
    >{/each}
{/snippet}

<parts.Line value={value ?? String(props.index)} {...props} children={children ?? fallback} />
