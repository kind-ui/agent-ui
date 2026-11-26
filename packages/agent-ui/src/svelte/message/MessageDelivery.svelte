<!-- Under a user message that isn't delivered yet: its words, then Withdraw or Retry, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import MessageDeliveryText from "./MessageDeliveryText.svelte";
  import MessageResend from "./MessageResend.svelte";
  import MessageWithdraw from "./MessageWithdraw.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Delivery> = $props();
</script>

{#snippet delivery()}
  <MessageDeliveryText
  /><MessageWithdraw
  /><MessageResend />
{/snippet}

<parts.Delivery {...props} children={children ?? delivery} />
