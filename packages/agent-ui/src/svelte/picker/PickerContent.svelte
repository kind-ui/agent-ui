<!-- The popover: the search field and the list, unless you pass children. Focus moves to the search field. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import PickerList from "./PickerList.svelte";
  import { type PickerParts, pickerConfig } from "./parts.js";

  type ContentProps = ComponentProps<PickerParts["Content"]>;
  type Props = ContentProps & { children?: Snippet };

  let { children: content, render: own, ...props }: Props = $props();
  const { parts } = pickerConfig();
</script>

<parts.Content initialFocus="input" sideOffset={6} align="start" {...props}>
  <!-- A sheet sits in a full-screen viewport, which renders only while the content presents as one. -->
  {#snippet render(handed: Parameters<NonNullable<ContentProps["render"]>>[0])}
    {#if handed.state.presentation === "sheet"}
      <parts.Viewport>{@render element(handed)}</parts.Viewport>
    {:else}
      {@render element(handed)}
    {/if}
  {/snippet}
  {#if content}{@render content()}{:else}<PickerList />{/if}
</parts.Content>

{#snippet element(handed: Parameters<NonNullable<ContentProps["render"]>>[0])}
  {#if own}{@render own(handed)}{:else}<div {...handed.props}>{@render handed.children?.(handed.state)}</div>{/if}
{/snippet}
