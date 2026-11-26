<!-- Calls `onAction`. Reads the `actionLabel` unless you pass children. Rendered only while `onAction` is set. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Action> = $props();
</script>

{#snippet label({ label }: { label: string })}{label}{/snippet}

<parts.Action {...props} children={children ?? label} />
