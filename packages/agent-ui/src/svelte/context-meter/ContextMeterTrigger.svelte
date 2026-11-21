<!-- Opens the details. Holds the meter unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ContextMeterValue from "./ContextMeterValue.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Trigger>;

  let { children: content, ...props }: Props = $props();
</script>

<parts.Trigger {...props}>
  {#snippet children(state: Parameters<NonNullable<Props["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<ContextMeterValue />{/if}
  {/snippet}
</parts.Trigger>
