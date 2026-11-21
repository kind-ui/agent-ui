<!-- The item's `title`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.ItemTitle> = $props();
</script>

<parts.ItemTitle {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{state.title}{/if}{/snippet}</parts.ItemTitle>
