<!--
  How much of the context window a conversation uses, and how much of the plan's limits: a ring and its percentage,
  with details that open on hover, keyboard focus and press, or sit in the page with `layout="inline"`. Any
  `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ContextMeterContent from "./ContextMeterContent.svelte";
  import ContextMeterDetails from "./ContextMeterDetails.svelte";
  import ContextMeterTrigger from "./ContextMeterTrigger.svelte";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = RootProps;

  let { open = $bindable(), children: content, ...props }: Props = $props();
</script>

<parts.Root bind:open {...props}>
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else if props.layout === "inline"}<ContextMeterDetails
      />{:else}<ContextMeterTrigger /><ContextMeterContent />{/if}
  {/snippet}
</parts.Root>
