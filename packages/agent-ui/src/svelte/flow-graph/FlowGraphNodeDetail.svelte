<!-- The node's kind and status, like "Agent · Running", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.NodeDetail> = $props();
</script>

{#snippet fallback({ detail }: { detail: string })}{detail}{/snippet}

<parts.NodeDetail {...props} children={children ?? fallback} />
