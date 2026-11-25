<!-- The amount used and the limit, unless you pass children. Describes the details. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Description> & { children?: Snippet<[{ countText: string }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Description {...props}>
  {#snippet children(state: { countText: string })}
    {#if content}{@render content(state)}{:else}{state.countText}{/if}
  {/snippet}
</parts.Description>
