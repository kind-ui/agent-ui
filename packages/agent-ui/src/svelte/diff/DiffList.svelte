<!-- A `DiffFile` for each file, keyed by its path, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffFile from "./DiffFile.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.List> = $props();
</script>

{#snippet fallback({ paths }: { paths: readonly string[] })}{#each paths as path (path)}<DiffFile
      value={path}
    />{/each}{/snippet}

<parts.List {...props} children={children ?? fallback} />
