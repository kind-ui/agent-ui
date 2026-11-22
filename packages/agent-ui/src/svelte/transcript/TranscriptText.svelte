<!-- A `TranscriptWord` for each of the segment's words, a space apart, or its whole text, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TranscriptWord from "./TranscriptWord.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Text> = $props();
</script>

{#snippet fallback({ words }: { words: readonly string[] })}
  {#each words as value, index (value)}{#if index > 0}{" "}{/if}<TranscriptWord {value} />{/each}
{/snippet}

<parts.Text {...props} children={children ?? fallback} />
