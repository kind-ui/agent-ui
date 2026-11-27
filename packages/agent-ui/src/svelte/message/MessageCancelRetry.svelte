<!-- Shown while `onCancelRetry` is set. "Cancel", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.CancelRetry> = $props();
</script>

{#snippet text({ label }: { label: string })}{label}{/snippet}

<parts.CancelRetry {...props} children={children ?? text} />
