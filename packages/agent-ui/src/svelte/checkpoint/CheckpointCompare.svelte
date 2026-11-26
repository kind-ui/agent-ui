<!-- Calls `onCompare`. Reads "Compare" with its icon unless you pass children. Rendered only with `onCompare`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Compare> = $props();
</script>

{#snippet fallback()}<span data-checkpoint-compare-icon="" aria-hidden="true"></span>Compare{/snippet}

<parts.Compare {...props} children={children ?? fallback} />
