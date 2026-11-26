<!-- Hidden: the node's `description` and its edges in words, which describe the node to screen readers. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.NodeDescription> = $props();
</script>

{#snippet fallback({ description }: { description: string })}{description}{/snippet}

<parts.NodeDescription {...props} children={children ?? fallback} />
