<script lang="ts">
  import { Message, MessageContent, MessageDelivery, MessageHeader } from "@/components/ui/svelte/message/index.js";

  const wait = () => new Promise((resolve) => setTimeout(resolve, 800));

  let queued = $state(true);
</script>

<div class="flex w-full max-w-xl flex-col gap-6">
  <Message aria-label="Your message" messageRole="user" delivery="steered" text="Use the staging database instead.">
    <MessageHeader>
      <MessageDelivery />
    </MessageHeader>
    <MessageContent>Use the staging database instead.</MessageContent>
  </Message>
  {#if queued}
    <Message
      aria-label="Your message"
      messageRole="user"
      delivery="queued"
      text="Then run the migrations."
      onWithdraw={async () => {
        await wait();
        queued = false;
      }}
    >
      <MessageHeader>
        <MessageDelivery />
      </MessageHeader>
      <MessageContent>Then run the migrations.</MessageContent>
    </Message>
  {/if}
</div>
