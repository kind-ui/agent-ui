<!-- The total in words, like "812 runs in the last year", which describes the grid. Visually hidden. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Summary> = $props();
</script>

{#snippet words({ text }: { text: string })}{text}{/snippet}

<parts.Summary {...props} children={children ?? words} />
