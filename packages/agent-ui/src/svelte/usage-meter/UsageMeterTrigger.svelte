<!-- Opens the details. Holds the meter unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import UsageMeterValue from "./UsageMeterValue.svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Trigger>;

  let { children: content, ...props }: Props = $props();
</script>

<parts.Trigger {...props}>
  {#snippet children(state: Parameters<NonNullable<Props["children"]>>[0])}
    {#if content}{@render content(state)}{:else}<UsageMeterValue />{/if}
  {/snippet}
</parts.Trigger>
