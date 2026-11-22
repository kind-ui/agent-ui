<!-- Calls `onSubmit`. Reads the `submitLabel` unless you pass children. Rendered only while `onSubmit` is set. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Submit> = $props();
</script>

<!-- The mark shows only while the button's call is pending (controls.css). -->
{#snippet withPendingMark({ label }: { label: string })}
  <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>{label}
{/snippet}

<parts.Submit {...props} children={children ?? withPendingMark} />
