<!-- A `TranscriptSegment` for each segment in view, keyed by its id, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TranscriptSegment from "./TranscriptSegment.svelte";

  let { children, ...props }: ComponentProps<typeof parts.List> = $props();
</script>

<!-- Each segment takes only its id, so a segment that stays in view keeps its props as the rows around it change. -->
{#snippet fallback({ rows }: { rows: readonly { key: string | number }[] })}
  {#each rows.map((row) => String(row.key)) as value (value)}<TranscriptSegment {value} />{/each}
{/snippet}

<parts.List {...props} children={children ?? fallback} />
