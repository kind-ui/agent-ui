<!-- Shows and hides the detail. Reads "Why?" unless you pass a `children` snippet. Rendered only with a `detail`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.DetailTrigger> = $props();
</script>

{#snippet why()}Why?{/snippet}

<parts.DetailTrigger {...props} children={children ?? why} />
