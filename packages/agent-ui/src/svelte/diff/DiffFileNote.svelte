<!-- "Binary file, not shown" or "Renamed, no changes" in place of lines, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FileNote> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.FileNote {...props} children={children ?? fallback} />
