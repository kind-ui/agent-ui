<!-- A run status badge: its mark and label. A `children` snippet, `StatusIcon` and `StatusLabel` among them, replaces both. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts, StatusLabel } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet both()}<parts.Icon /><StatusLabel />{/snippet}

<parts.Root {...props} children={children ?? both} />
