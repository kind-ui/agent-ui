<!-- "Keep", named with the path, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FileKeep> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.FileKeep {...props} children={children ?? fallback} />
