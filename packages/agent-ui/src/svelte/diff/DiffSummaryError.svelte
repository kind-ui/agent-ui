<!-- "Couldn't undo all changes", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.SummaryError> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.SummaryError {...props} children={children ?? fallback} />
