<!--
  Usage against a limit, like spend this month: a ring and its percentage that warns from `warnAt`, with details that
  open on hover, keyboard focus and press. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import UsageMeterContent from "./UsageMeterContent.svelte";
  import UsageMeterTrigger from "./UsageMeterTrigger.svelte";

  type RootProps = ComponentProps<typeof parts.Root>;
  type Props = RootProps;

  let { open = $bindable(), children: content, ...props }: Props = $props();
</script>

<parts.Root bind:open {...props}>
  {#snippet children(state: Parameters<NonNullable<RootProps["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<UsageMeterTrigger /><UsageMeterContent />{/if}
  {/snippet}
</parts.Root>
