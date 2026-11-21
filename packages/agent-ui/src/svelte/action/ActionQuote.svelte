<!-- The `quote`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Quote> = $props();
</script>

{#snippet fallback({ quote }: { quote: string })}{quote}{/snippet}

<parts.Quote {...props} children={children ?? fallback} />
