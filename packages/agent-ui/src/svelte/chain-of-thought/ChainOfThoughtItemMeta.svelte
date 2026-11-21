<!-- The step's `durationSeconds`, as "N s", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.ItemMeta> = $props();
</script>

<parts.ItemMeta {...props}>
  {#snippet children(state)}
    {#if content}{@render content(state)}{:else}{state.duration}{/if}
  {/snippet}
</parts.ItemMeta>
