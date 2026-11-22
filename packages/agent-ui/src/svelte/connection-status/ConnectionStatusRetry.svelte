<!-- "Retry", unless you pass a `children` snippet. Rendered only with `onRetry`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Retry> = $props();
</script>

{#snippet label({ label }: { label: string })}{label}{/snippet}

<parts.Retry {...props} children={children ?? label} />
