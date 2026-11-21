<!-- The item's `description`, unless you pass children. Hidden while empty. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.ItemDescription> = $props();
</script>

<parts.ItemDescription {...props}>
  {#snippet children(state)}{#if content}{@render content(state)}{:else}{state.description}{/if}{/snippet}
</parts.ItemDescription>
