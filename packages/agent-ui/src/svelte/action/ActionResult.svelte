<!-- The `result` as markdown, streaming while the action runs, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Markdown } from "../markdown/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Result> = $props();
</script>

{#snippet fallback({ result, streaming }: { result: string; streaming: boolean })}
  <Markdown source={result} {streaming} />
{/snippet}

<parts.Result {...props} children={children ?? fallback} />
