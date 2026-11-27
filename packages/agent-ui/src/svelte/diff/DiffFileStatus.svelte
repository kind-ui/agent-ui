<!-- "Added", "Deleted" or "Renamed", unless you pass children. Absent for a modified file. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FileStatus> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.FileStatus {...props} children={children ?? fallback} />
