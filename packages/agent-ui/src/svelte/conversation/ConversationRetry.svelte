<!-- Calls `onRetry`, shown only while it's set. "Retry", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Retry> = $props();
</script>

{#snippet text()}Retry{/snippet}

<parts.Retry {...props} children={children ?? text} />
