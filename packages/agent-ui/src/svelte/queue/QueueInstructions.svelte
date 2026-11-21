<!-- The keys that move and remove items, read with each item and hidden from sight, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Instructions> = $props();
</script>

<parts.Instructions {...props}>
  {#snippet children(state)}{#if content}{@render content(state)}{:else}{state.text}{/if}{/snippet}
</parts.Instructions>
