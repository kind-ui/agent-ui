<!--
  A row of context chips: the ones that don't fit go behind a "+N" button whose popover lists them. With `onRemove`,
  Delete, Backspace or a chip's remove control removes it. Any `children` replace the list, the button and the popover.
-->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import ContextBarContent from "./ContextBarContent.svelte";
  import ContextBarList from "./ContextBarList.svelte";
  import ContextBarOverflow from "./ContextBarOverflow.svelte";
  import type { ContextBarChipData } from "./index.js";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = Omit<RootProps, "chips"> & {
    chips?: readonly ContextBarChipData[];
    children?: Snippet;
  };

  let { open = $bindable(), id, render: own, children, ...props }: Props = $props();
</script>

<!--
  The `id` goes on the element, not the part: `@ui-sdk/svelte` keys a part by its `id`, and the agent bridge names a
  component only by a root without a key.
-->
<parts.Root bind:open {...props}>
  {#snippet render(handed: Parameters<NonNullable<RootProps["render"]>>[0])}
    {#if own}{@render own({ ...handed, props: { ...handed.props, id } })}{:else}
      <div {...handed.props} {id}>{@render handed.children?.(handed.state)}</div>
    {/if}
  {/snippet}
  {#if children}{@render children()}{:else}<ContextBarList /><ContextBarOverflow /><ContextBarContent />{/if}
</parts.Root>
