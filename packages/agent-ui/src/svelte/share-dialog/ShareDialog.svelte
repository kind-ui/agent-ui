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
    id,
    render: own,
    children: content,
    ...props
  }: RootProps = $props();
</script>

<!--
  The `id` goes on the element, not the part: `@ui-sdk/svelte` keys a part by its `id`, and the agent bridge names a
  component only by a root without a key.
-->
<parts.Root bind:open bind:visibility {...props}>
  {#snippet render(handed: Parameters<NonNullable<RootProps["render"]>>[0])}
    {#if own}{@render own({ ...handed, props: { ...handed.props, id } })}{:else}
      <div {...handed.props} {id}>{@render handed.children?.(handed.state)}</div>
    {/if}
  {/snippet}
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<ShareDialogTrigger /><parts.Backdrop /><ShareDialogContent />{/if}
  {/snippet}
</parts.Root>
