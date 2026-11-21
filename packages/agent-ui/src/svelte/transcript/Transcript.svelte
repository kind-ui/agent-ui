<!--
  Speaker-labelled, timed segments with a search, marking the segment and word playing at `currentTime`. Any
  `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TranscriptList from "./TranscriptList.svelte";
  import TranscriptSearch from "./TranscriptSearch.svelte";

  let { children, query = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<TranscriptSearch /><parts.Viewport><TranscriptList /></parts.Viewport>{/snippet}

<parts.Root {...props} bind:query children={children ?? fallback} />
