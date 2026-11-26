<!-- The path, after the old one for a rename, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Path> = $props();
</script>

{#snippet fallback({ path, oldPath }: { path: string; oldPath: string | undefined })}{#if oldPath && oldPath !== path}<span
      data-diff-old-path="">{oldPath}</span
    >{path}{:else}{path}{/if}{/snippet}

<parts.Path {...props} children={children ?? fallback} />
