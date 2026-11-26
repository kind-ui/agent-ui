<!--
  A run status badge: its mark, label and, while stalled, "No update for 5 min". A `children` snippet, `StatusIcon`,
  `StatusLabel` and `StatusStalled` among them, replaces these.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts, StatusLabel, StatusStalled } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet all()}<parts.Icon /><StatusLabel /><StatusStalled />{/snippet}

<parts.Root {...props} children={children ?? all} />
