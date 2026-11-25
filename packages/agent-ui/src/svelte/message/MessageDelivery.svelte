<!-- Put it in the header. With `delivery`, its mark and words, then Withdraw while queued, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import MessageDeliveryText from "./MessageDeliveryText.svelte";
  import MessageWithdraw from "./MessageWithdraw.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Delivery> = $props();
</script>

{#snippet delivery()}
  <parts.DeliveryIcon
  /><MessageDeliveryText
  /><MessageWithdraw />
{/snippet}

<parts.Delivery {...props} children={children ?? delivery} />
