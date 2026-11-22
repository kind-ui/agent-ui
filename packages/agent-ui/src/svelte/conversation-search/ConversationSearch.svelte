<!--
  A find bar over a Conversation's messages: the field with its count, Previous, Next and Close, unless you pass a
  `children` snippet. Pass `conversation` the Conversation's controller and wire `onMarksChange` to its `marks`.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ConversationSearchInput from "./ConversationSearchInput.svelte";
  import { parts } from "./parts.js";

  let {
    children,
    query = $bindable(),
    open = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<ConversationSearchInput /><parts.Previous /><parts.Next /><parts.Close />{/snippet}

<parts.Root {...props} bind:query bind:open children={children ?? fallback} />
