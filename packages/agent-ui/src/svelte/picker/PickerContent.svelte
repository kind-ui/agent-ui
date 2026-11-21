<!-- The popover: the search field and the list, unless you pass children. Focus moves to the search field. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import PickerList from "./PickerList.svelte";
  import PickerRowsBound from "./PickerRowsBound.svelte";
  import { type PickerParts, pickerConfig } from "./parts.js";

  type ContentProps = ComponentProps<PickerParts["Content"]>;
  type Props = ContentProps;

  let { children: content, render: own, ...props }: Props = $props();
  const { parts } = pickerConfig();
  // UI SDK binds the content only once its rows have, so a sheet measures its full height before its opening motion
  // starts and never resizes during it: a resize then makes `@ui-sdk/core`'s sheet sync throw (AGENTS.md).
  let rowsBound = $state(false);
  // Leaves out the symbol-keyed attachment UI SDK binds the element with.
  const unbound = <Attrs extends object>(attrs: Attrs) => Object.fromEntries(Object.entries(attrs)) as Attrs;
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
  {#snippet children(state: Parameters<NonNullable<ContentProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<PickerList />{/if}<PickerRowsBound
      onbound={() => (rowsBound = true)}
      onunbound={() => (rowsBound = false)}
    />
  {/snippet}
</parts.Content>

{#snippet element(handed: Parameters<NonNullable<ContentProps["render"]>>[0])}
  {@const attrs = rowsBound ? handed.props : unbound(handed.props)}
  {#if own}{@render own({ ...handed, props: attrs })}{:else}<div {...attrs}>{@render handed.children?.(handed.state)}</div>{/if}
{/snippet}
