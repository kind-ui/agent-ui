<!-- Copies the `content`. Wraps a `KindToolbarButton` named "Copy", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindToolbarButton } from "../internal/toolbar/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Copy> = $props();
</script>

{#snippet fallback()}<KindToolbarButton aria-label="Copy" />{/snippet}

<parts.Copy {...props} children={children ?? fallback} />
