<!--
  The "Search chats" dialog: a button that opens a search over the threads, grouped by date, with "New chat" after
  them. Choosing a thread calls `onSelect` and closes it. Any `children` replace the trigger and the dialog.
-->
<script lang="ts">
  import type { PickerRow } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import PickerContent from "../picker/PickerContent.svelte";
  import PickerList from "../picker/PickerList.svelte";
  import { type PickerParts, setPickerConfig } from "../picker/parts.js";
  import { parts } from "./parts.js";
  import ThreadSearchHints from "./ThreadSearchHints.svelte";
  import ThreadSearchTrigger from "./ThreadSearchTrigger.svelte";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = { [K in keyof RootProps as K extends "children" ? never : K]: RootProps[K] } & {
    children?: Snippet;
  };

  let { open = $bindable(), query = $bindable(), id, render: own, children, ...props }: Props = $props();
  // Its parts are Picker's, with state the picker parts never read. The status mark ends the row, after the date,
  // since Command hides an item's icon from assistive technology and a status needs its words.
  setPickerConfig({ parts: parts as unknown as PickerParts, icon: null, trailing });
</script>

{#snippet trailing(row: PickerRow)}
  {#if row.icon !== undefined}<parts.Status value={row.option.value} />{/if}
{/snippet}

<!--
  The `id` goes on the element, not the part: `@ui-sdk/svelte` keys a part by its `id`, and the agent bridge names a
  component only by a root without a key.
-->
<parts.Root bind:open bind:query {...props}>
  {#snippet render(handed: Parameters<NonNullable<RootProps["render"]>>[0])}
    {#if own}{@render own({ ...handed, props: { ...handed.props, id } })}{:else}
      <div {...handed.props} {id}>{@render handed.children?.(handed.state)}</div>
    {/if}
  {/snippet}
  {#if children}{@render children()}{:else}
    <ThreadSearchTrigger />
    <parts.Backdrop />
    <PickerContent>
      <PickerList />
      <ThreadSearchHints />
    </PickerContent>
  {/if}
</parts.Root>
