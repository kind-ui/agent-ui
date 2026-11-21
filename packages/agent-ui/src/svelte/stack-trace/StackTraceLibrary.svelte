<!-- Shows or folds library frames. "N library frames", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Library> = $props();
</script>

{#snippet fallback({ count }: { count: number })}{count} library {count === 1 ? "frame" : "frames"}{/snippet}

<parts.Library {...props} children={children ?? fallback} />
