<!-- Zoom in, Zoom out and Fit, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Controls> = $props();
</script>

{#snippet fallback()}
  <parts.ZoomIn /><parts.ZoomOut /><parts.Fit />
{/snippet}

<parts.Controls {...props} children={children ?? fallback} />
