<!-- "Show full diff (6,400 lines)" for a file cut off at 2,000 rows, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ShowAll> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.ShowAll {...props} children={children ?? fallback} />
