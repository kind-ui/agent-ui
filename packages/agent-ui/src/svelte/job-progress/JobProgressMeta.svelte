<!-- The time elapsed and left, like "2 min elapsed, about 1 min left", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Meta> = $props();
</script>

<parts.Meta {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{state.label}{/if}{/snippet}</parts.Meta>
