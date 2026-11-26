<!-- "3 kept, 1 undone" once every change is reviewed, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.SummaryOutcome> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.SummaryOutcome {...props} children={children ?? fallback} />
