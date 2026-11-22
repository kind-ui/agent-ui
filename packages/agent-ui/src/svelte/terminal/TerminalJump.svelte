<!-- Shown while the reader has scrolled away from the end. "Jump to latest", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Jump> = $props();
</script>

{#snippet fallback()}Jump to latest{/snippet}

<parts.Jump {...props} children={children ?? fallback} />
