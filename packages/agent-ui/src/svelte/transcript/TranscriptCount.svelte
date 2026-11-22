<!-- "3 matches" while there's a search, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Count> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Count {...props} children={children ?? fallback} />
