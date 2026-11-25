<!-- "Show N lines", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Collapsed> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Collapsed {...props} children={children ?? fallback} />
