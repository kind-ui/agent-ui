<!-- The speaker, with what the search matched marked, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Speaker> = $props();
</script>

{#snippet fallback({ speaker }: { speaker: readonly { text: string; match: boolean }[] })}{#each speaker as piece}{#if piece.match}<mark>{piece.text}</mark>{:else}{piece.text}{/if}{/each}{/snippet}

<parts.Speaker {...props} children={children ?? fallback} />
