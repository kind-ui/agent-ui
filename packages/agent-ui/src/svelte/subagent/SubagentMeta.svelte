<!-- The status in words, like "Working" or "Done in 12 s", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Meta> = $props();
</script>

<parts.Meta {...props}>
  {#snippet children(state)}
    {#if content}{@render content(state)}{:else}{state.label}{/if}
  {/snippet}
</parts.Meta>
