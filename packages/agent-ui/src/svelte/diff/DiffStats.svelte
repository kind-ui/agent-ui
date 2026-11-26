<!-- "+12 −3", read as "12 added, 3 removed", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Stats> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Stats {...props} children={children ?? fallback} />
