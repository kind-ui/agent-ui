<!-- Shown while `onRetry` is set and the message failed. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Retry> = $props();
</script>

{#snippet text()}Retry{/snippet}

<parts.Retry {...props} children={children ?? text} />
