<!-- Who can open the chat, in words, unless you pass children. Describes the dialog. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Description> & { children?: Snippet<[{ text: string }]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Description {...props}>
  {#snippet children(state: { text: string })}
    {#if content}{@render content(state)}{:else}{state.text}{/if}
  {/snippet}
</parts.Description>
