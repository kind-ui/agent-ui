<!-- The source's `snippet`, unless you pass children. Rendered only with a `snippet`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Snippet> = $props();
</script>

{#snippet fallback({ snippet }: { snippet: string })}{snippet}{/snippet}

<parts.Snippet {...props} children={children ?? fallback} />
