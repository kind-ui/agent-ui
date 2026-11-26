<!-- "Sending decision", else the deadline ("Decide in 4 min", then "Expired"), unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Meta> = $props();
</script>

<parts.Meta {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{state.text}{/if}{/snippet}</parts.Meta>
