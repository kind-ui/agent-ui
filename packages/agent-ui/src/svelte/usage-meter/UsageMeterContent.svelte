<!-- The details: the title, the amounts, the period and the breakdown, unless you pass children. Leaves focus on the trigger. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import UsageMeterBreakdown from "./UsageMeterBreakdown.svelte";
  import UsageMeterBreakdownRows from "./UsageMeterBreakdownRows.svelte";
  import UsageMeterDescription from "./UsageMeterDescription.svelte";
  import UsageMeterPeriod from "./UsageMeterPeriod.svelte";
  import UsageMeterTitle from "./UsageMeterTitle.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Content>;

  let { children: content, ...props }: Props = $props();
</script>

<parts.Content initialFocus="none" {...props}>
  {#snippet children(state: Parameters<NonNullable<Props["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<UsageMeterTitle /><UsageMeterDescription /><UsageMeterPeriod /><UsageMeterBreakdown /><UsageMeterBreakdownRows />{/if}
  {/snippet}
</parts.Content>
