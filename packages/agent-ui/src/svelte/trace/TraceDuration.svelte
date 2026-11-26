<!-- How long a span took, or has run so far, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Duration> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Duration {...props} children={children ?? fallback} />
