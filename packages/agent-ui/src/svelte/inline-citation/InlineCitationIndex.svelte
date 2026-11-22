<!-- Which source the card shows, like "1 of 3", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Index> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Index {...props} children={children ?? fallback} />
