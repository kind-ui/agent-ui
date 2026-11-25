<!-- The collapsed lines, hidden until find in page matches one, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.CollapsedText> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.CollapsedText {...props} children={children ?? fallback} />
