<!-- The `label`, unless you pass children. Rendered only while `label` is set, and hidden inside a Tool. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

<parts.Title {...props}>
  {#snippet children(state: { label: string })}
    {#if content}{@render content(state)}{:else}{state.label}{/if}
  {/snippet}
</parts.Title>
