<!-- The `label`, else the `agentName`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

<parts.Title {...props}>
  {#snippet children(state)}
    {#if content}{@render content(state)}{:else}{state.title}{/if}
  {/snippet}
</parts.Title>
