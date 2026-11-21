<!--
  A Share button whose dialog chooses who can open the chat and shows the link the host makes, with Copy link and
  Stop sharing. Any `children` replace the trigger and the dialog.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ShareDialogContent from "./ShareDialogContent.svelte";
  import ShareDialogTrigger from "./ShareDialogTrigger.svelte";

  type RootProps = ComponentProps<typeof parts.Root>;

  let {
    open = $bindable(),
    visibility = $bindable(),
    children: content,
    ...props
  }: RootProps = $props();
</script>

<parts.Root bind:open bind:visibility {...props}>
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<ShareDialogTrigger /><parts.Backdrop /><ShareDialogContent />{/if}
  {/snippet}
</parts.Root>
