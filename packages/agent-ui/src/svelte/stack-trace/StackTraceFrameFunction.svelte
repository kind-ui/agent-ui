<!-- The frame's function, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.FrameFunction> = $props();
</script>

{#snippet fallback({ fn }: { fn: string })}{fn}{/snippet}

<parts.FrameFunction {...props} children={children ?? fallback} />
