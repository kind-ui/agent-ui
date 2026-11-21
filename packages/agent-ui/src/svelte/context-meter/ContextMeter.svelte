<!--
  How much of the context window a conversation uses: a ring and its percentage, with details that open on hover,
  keyboard focus and press. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ContextMeterContent from "./ContextMeterContent.svelte";
  import ContextMeterTrigger from "./ContextMeterTrigger.svelte";
  import { parts } from "./parts.js";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = RootProps;

  let { open = $bindable(), id, render: own, children: content, ...props }: Props = $props();
</script>

<!--
  The `id` goes on the element, not the part: `@ui-sdk/svelte` keys a part by its `id`, and the agent bridge names a
  component only by a root without a key, so the meter would be named by its trigger.
-->
<parts.Root bind:open {...props}>
  {#snippet render(handed: Parameters<NonNullable<RootProps["render"]>>[0])}
    {#if own}{@render own({ ...handed, props: { ...handed.props, id } })}{:else}
      <div {...handed.props} {id}>{@render handed.children?.(handed.state)}</div>
    {/if}
  {/snippet}
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<ContextMeterTrigger /><ContextMeterContent />{/if}
  {/snippet}
</parts.Root>
