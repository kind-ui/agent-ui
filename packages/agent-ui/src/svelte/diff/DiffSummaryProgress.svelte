<!-- "2 of 4 reviewed", then "3 kept, 1 undone", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.SummaryProgress> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.SummaryProgress {...props} children={children ?? fallback} />
