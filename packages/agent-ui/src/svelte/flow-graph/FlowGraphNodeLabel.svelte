<!-- The node's `label`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.NodeLabel> = $props();
</script>

{#snippet fallback({ label }: { label: string })}{label}{/snippet}

<parts.NodeLabel {...props} children={children ?? fallback} />
