<!-- The status mark and the status in words, like "Accepted", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Status> = $props();
</script>

{#snippet fallback({ text }: { text: string })}<parts.StatusIcon />{text}{/snippet}

<parts.Status {...props} children={children ?? fallback} />
