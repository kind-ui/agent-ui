<!-- A column's name for screen readers, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Column> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Column {...props} children={children ?? fallback} />
