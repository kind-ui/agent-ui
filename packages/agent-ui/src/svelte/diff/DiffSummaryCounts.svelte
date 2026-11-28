<!-- "+120 −8", read as "120 additions, 8 deletions", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Counts from "./Counts.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.SummaryCounts> = $props();
</script>

{#snippet fallback({ added, removed, name }: { added: string; removed: string; name: string })}<Counts
    {added}
    {removed}
    {name}
  />{/snippet}

<parts.SummaryCounts {...props} children={children ?? fallback} />
