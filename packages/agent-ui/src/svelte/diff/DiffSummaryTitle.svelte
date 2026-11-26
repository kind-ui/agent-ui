<!-- "4 files changed", "Editing 2 files" or "All changes reviewed", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.SummaryTitle> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.SummaryTitle {...props} children={children ?? fallback} />
