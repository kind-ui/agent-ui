<!-- Shows and hides the list. Reads the `label`, else "Used N sources", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Trigger> = $props();
</script>

{#snippet fallback({ label }: { label: string })}{label}{/snippet}

<parts.Trigger {...props} children={children ?? fallback} />
