<!-- The frame's file, shortened to its last two segments, with line and column, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FrameLocation> = $props();
</script>

{#snippet fallback({ location }: { location: string })}{location}{/snippet}

<parts.FrameLocation {...props} children={children ?? fallback} />
