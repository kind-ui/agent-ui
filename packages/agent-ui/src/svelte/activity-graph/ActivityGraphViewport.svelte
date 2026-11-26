<!-- Scrolls the grid sideways when it doesn't fit, starting at the latest week. Holds the grid unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ActivityGraphGrid from "./ActivityGraphGrid.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Viewport> = $props();
</script>

{#snippet fallback()}<ActivityGraphGrid />{/snippet}

<parts.Viewport {...props} children={children ?? fallback} />
