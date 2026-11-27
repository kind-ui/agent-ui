<!--
  A run status badge: its mark, label and, while stalled, "No update for 5 min". A `children` snippet, `StatusIcon`,
  `StatusLabel` and `StatusStalled` among them, replaces these.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import StatusLabel from "./StatusLabel.svelte";
  import StatusStalled from "./StatusStalled.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet all()}<parts.Icon /><StatusLabel /><StatusStalled />{/snippet}

<parts.Root {...props} children={children ?? all} />
