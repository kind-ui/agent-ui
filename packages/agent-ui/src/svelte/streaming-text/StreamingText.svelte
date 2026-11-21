<!-- Streamed plain text: each appended chunk fades in, and `caret` shows a caret after it. -->
<script lang="ts">
  import type { StreamingTextState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let props: ComponentProps<typeof parts.Root> & { children?: never } = $props();
</script>

<parts.Root {...props}>
  {#snippet children({ chunks }: StreamingTextState)}
    {#each chunks as chunk (chunk.id)}<parts.Chunk value={chunk.id}>{chunk.text}</parts.Chunk>{/each}<parts.Caret />
  {/snippet}
</parts.Root>
