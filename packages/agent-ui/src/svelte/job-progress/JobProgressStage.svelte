<!-- The stage, like "3 of 7: Installing dependencies", else the title for assistive technology alone. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Stage> = $props();
</script>

<parts.Stage {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{state.text}{/if}{/snippet}</parts.Stage>
