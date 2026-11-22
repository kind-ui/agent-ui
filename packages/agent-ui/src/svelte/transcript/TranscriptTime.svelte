<!-- When the segment starts, like "1:05", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Time> = $props();
</script>

{#snippet fallback({ time }: { time: string })}{time}{/snippet}

<parts.Time {...props} children={children ?? fallback} />
