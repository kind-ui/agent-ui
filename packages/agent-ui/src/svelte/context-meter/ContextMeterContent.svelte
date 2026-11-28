<!--
  The details: how full, Compact, the breakdown, the counts and the limits, unless you pass children. Leaves focus
  on the trigger.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ContextMeterDetails from "./ContextMeterDetails.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Content>;

  let { children: content, render: own, ...props }: Props = $props();
</script>

<parts.Content initialFocus="none" {...props}>
  <!-- A sheet sits in a full-screen viewport, which renders only while the content presents as one. -->
  {#snippet render(handed: Parameters<NonNullable<Props["render"]>>[0])}
    {#if handed.state.presentation === "sheet"}
      <parts.Viewport>{@render element(handed)}</parts.Viewport>
    {:else}
      {@render element(handed)}
    {/if}
  {/snippet}
  {#snippet children(state: Parameters<NonNullable<Props["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<ContextMeterDetails />{/if}
  {/snippet}
</parts.Content>

{#snippet element(handed: Parameters<NonNullable<Props["render"]>>[0])}
  {#if own}{@render own(handed)}{:else}<div {...handed.props}>{@render handed.children?.(handed.state)}</div>{/if}
{/snippet}
