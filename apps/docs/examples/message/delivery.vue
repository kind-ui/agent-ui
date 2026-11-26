<script setup lang="ts">
import { ref } from "vue";
import { Message, MessageContent, MessageDelivery, MessageHeader } from "@/components/ui/vue/message";

const wait = () => new Promise((resolve) => setTimeout(resolve, 800));

const queued = ref(true);

async function withdraw() {
  await wait();
  queued.value = false;
}
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-6">
    <Message
      aria-label="Your message"
      message-role="user"
      delivery="steered"
      text="Use the staging database instead."
    >
      <MessageHeader>
        <MessageDelivery />
      </MessageHeader>
      <MessageContent>Use the staging database instead.</MessageContent>
    </Message>
    <Message
      v-if="queued"
      aria-label="Your message"
      message-role="user"
      delivery="queued"
      text="Then run the migrations."
      @withdraw="withdraw"
    >
      <MessageHeader>
        <MessageDelivery />
      </MessageHeader>
      <MessageContent>Then run the migrations.</MessageContent>
    </Message>
  </div>
</template>
