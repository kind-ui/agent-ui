<!-- How many items are complete, as "2 of 5", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Meta> = $props();
</script>

<parts.Meta {...props}>
  {#snippet children(state)}
    {#if content}{@render content(state)}{:else}{state.done} of {state.total}{/if}
  {/snippet}
</parts.Meta>
