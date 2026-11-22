<!-- What went wrong, under a muted image glyph, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

{#snippet fallback({ message }: { message: string })}{message}{/snippet}

<parts.Error {...props} children={children ?? fallback} />
