<!--
  The word whose `value` is `"<segment id>/<index>"`, or a segment's whole text without words, with what the search
  matched marked, unless you pass children.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Word> = $props();
</script>

{#snippet fallback({ text }: { text: readonly { text: string; match: boolean }[] })}{#each text as piece}{#if piece.match}<mark>{piece.text}</mark>{:else}{piece.text}{/if}{/each}{/snippet}

<parts.Word {...props} children={children ?? fallback} />
