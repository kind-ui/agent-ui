<!-- The dialog: its title, who can open the chat, the link and its actions, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ShareDialogClose from "./ShareDialogClose.svelte";
  import ShareDialogCopy from "./ShareDialogCopy.svelte";
  import ShareDialogCreate from "./ShareDialogCreate.svelte";
  import ShareDialogDescription from "./ShareDialogDescription.svelte";
  import ShareDialogError from "./ShareDialogError.svelte";
  import ShareDialogLink from "./ShareDialogLink.svelte";
  import ShareDialogRevoke from "./ShareDialogRevoke.svelte";
  import ShareDialogTitle from "./ShareDialogTitle.svelte";
  import ShareDialogVisibility from "./ShareDialogVisibility.svelte";

  type ContentProps = ComponentProps<typeof parts.Content>;

  let { children: content, render: own, ...props }: ContentProps = $props();
</script>

<parts.Content {...props}>
  <!-- A sheet sits in a full-screen viewport, which renders only while the content presents as one. -->
  {#snippet render(handed: Parameters<NonNullable<ContentProps["render"]>>[0])}
    {#if handed.state.presentation === "sheet"}
      <parts.Viewport>{@render element(handed)}</parts.Viewport>
    {:else}
      {@render element(handed)}
    {/if}
  {/snippet}
  {#snippet children(state: Parameters<NonNullable<ContentProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}
      <div data-share-dialog-header="">
        <ShareDialogTitle
        /><ShareDialogDescription />
      </div
      ><ShareDialogVisibility
      /><div data-share-dialog-link-row="">
        <ShareDialogCreate
        /><ShareDialogLink
        /><ShareDialogCopy />
      </div
      ><div data-share-dialog-footer="">
        <ShareDialogError
        /><ShareDialogRevoke
        /><ShareDialogClose />
      </div>
    {/if}
  {/snippet}
</parts.Content>

{#snippet element(handed: Parameters<NonNullable<ContentProps["render"]>>[0])}
  {#if own}{@render own(handed)}{:else}<div {...handed.props}>{@render handed.children?.(handed.state)}</div>{/if}
{/snippet}
