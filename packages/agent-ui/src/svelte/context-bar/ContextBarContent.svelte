<!-- The popover of the chips that don't fit, unless you pass children. Focus moves to the first. -->
<script lang="ts">
  import { CONTEXT_BAR_FIRST_ITEM } from "@kind-ui/agent-ui/core";
  import type { ComponentProps, Snippet } from "svelte";
  import ContextBarOverflowList from "./ContextBarOverflowList.svelte";
  import ContextBarTitle from "./ContextBarTitle.svelte";
  import { parts } from "./parts.js";

  type ContentProps = ComponentProps<typeof parts.Content>;
  type Props = ContentProps & { children?: Snippet };

  let { children: content, render: own, ...props }: Props = $props();
</script>

<parts.Content initialFocus={CONTEXT_BAR_FIRST_ITEM} sideOffset={6} align="end" {...props}>
  <!-- A sheet sits in a full-screen viewport, which renders only while the content presents as one. -->
  {#snippet render(handed: Parameters<NonNullable<ContentProps["render"]>>[0])}
    {#if handed.state.presentation === "sheet"}
      <parts.Viewport>{@render element(handed)}</parts.Viewport>
    {:else}
      {@render element(handed)}
    {/if}
  {/snippet}
  {#if content}{@render content()}{:else}<ContextBarTitle /><ContextBarOverflowList />{/if}
</parts.Content>

{#snippet element(handed: Parameters<NonNullable<ContentProps["render"]>>[0])}
  {#if own}{@render own(handed)}{:else}<div {...handed.props}>{@render handed.children?.(handed.state)}</div>{/if}
{/snippet}
