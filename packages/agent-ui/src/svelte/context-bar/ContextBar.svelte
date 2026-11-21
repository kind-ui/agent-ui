<!--
  A row of context chips: the ones that don't fit go behind a "+N" button whose popover lists them. With `onRemove`,
  Delete, Backspace or a chip's remove control removes it. Any `children` replace the list, the button and the popover.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ContextBarContent from "./ContextBarContent.svelte";
  import ContextBarList from "./ContextBarList.svelte";
  import ContextBarOverflow from "./ContextBarOverflow.svelte";
  import type { ContextBarChipData } from "./index.js";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = { [K in keyof RootProps as K extends "chips" ? never : K]: RootProps[K] } & {
    chips?: readonly ContextBarChipData[];
    children?: RootProps["children"];
  };

  let { open = $bindable(), children: content, ...props }: Props = $props();
</script>

<parts.Root bind:open {...props}>
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<ContextBarList /><ContextBarOverflow /><ContextBarContent />{/if}
  {/snippet}
</parts.Root>
