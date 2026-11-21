<!-- "3 of 12", or "0 of 0" without a match, while there's a search, unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Count> = $props();
</script>

{#snippet words({ text }: { text: string })}{text}{/snippet}

<parts.Count {...props} children={children ?? words} />
