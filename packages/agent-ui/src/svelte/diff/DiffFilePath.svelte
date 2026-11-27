<!-- The path, cut at its start when it's long so the file name stays, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FilePath> = $props();
</script>

{#snippet fallback({ text }: { text: string })}<bdi>{text}</bdi>{/snippet}

<parts.FilePath {...props} children={children ?? fallback} />
