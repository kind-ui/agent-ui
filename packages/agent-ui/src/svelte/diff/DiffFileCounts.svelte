<!-- "+4 −2", read as "4 additions, 2 deletions", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Counts from "./Counts.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FileCounts> = $props();
</script>

{#snippet fallback({ added, removed, name }: { added: string; removed: string; name: string })}<Counts
    {added}
    {removed}
    {name}
  />{/snippet}

<parts.FileCounts {...props} children={children ?? fallback} />
