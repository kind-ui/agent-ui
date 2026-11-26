<!-- Shown while `onRetryNow` is set. "Retry now", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.RetryNow> = $props();
</script>

{#snippet text({ label }: { label: string })}{label}{/snippet}

<parts.RetryNow {...props} children={children ?? text} />
