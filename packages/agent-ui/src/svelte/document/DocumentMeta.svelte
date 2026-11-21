<!-- What the document is and its size, like "Markdown · 2.4 kB", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Meta> = $props();
</script>

{#snippet fallback({ meta }: { meta: string })}{meta}{/snippet}

<parts.Meta {...props} children={children ?? fallback} />
