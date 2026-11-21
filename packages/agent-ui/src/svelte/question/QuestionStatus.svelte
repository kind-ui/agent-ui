<!--
  "Sending answers" or "Skipping" while the host has them, unless you pass children. The pressed button holds the
  running mark, so the words stand alone.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Status> = $props();
</script>

{#snippet defaultLabel({ label }: { label: string })}{label}{/snippet}

<parts.Status {...props} children={children ?? defaultLabel} />
