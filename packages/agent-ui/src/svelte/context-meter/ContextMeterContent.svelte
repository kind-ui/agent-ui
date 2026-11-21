<!-- The details: the title, the value and each count, unless you pass children. Leaves focus on the trigger. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ContextMeterDescription from "./ContextMeterDescription.svelte";
  import ContextMeterRows from "./ContextMeterRows.svelte";
  import ContextMeterTitle from "./ContextMeterTitle.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Content>;

  let { children: content, ...props }: Props = $props();
</script>

<parts.Content initialFocus="none" {...props}>
  {#snippet children(state: Parameters<NonNullable<Props["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<ContextMeterTitle /><ContextMeterDescription /><ContextMeterRows />{/if}
  {/snippet}
</parts.Content>
