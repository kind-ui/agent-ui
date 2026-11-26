<!--
  Calls `onRunNow`. "Run now", or "Starting" while pending, unless you pass a `children` snippet. Rendered only with
  `onRunNow`.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.RunNow> = $props();
</script>

{#snippet words({ label }: { label: string })}{label}{/snippet}

<parts.RunNow {...props} children={children ?? words} />
