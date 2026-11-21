<!-- The source's `title`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.SourceTitle> = $props();
</script>

{#snippet fallback({ title }: { title: string })}{title}{/snippet}

<parts.SourceTitle {...props} children={children ?? fallback} />
