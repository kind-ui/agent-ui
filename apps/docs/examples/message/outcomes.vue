<script setup lang="ts">
import type { MessageStatus } from "@kind-ui/agent-ui";
import { ref } from "vue";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/vue/message";

const wait = () => new Promise((resolve) => setTimeout(resolve, 800));

const stopped = ref<{ status: MessageStatus; text: string }>({
  status: "aborted",
  text: "Start with the slowest query: it scans the whole orders table",
});
const failed = ref<{ status: MessageStatus; text: string }>({ status: "error", text: "" });

async function resume() {
  await wait();
  stopped.value = {
    status: "complete",
    text: `${stopped.value.text}, so an index on customer_id brings it under 10 ms.`,
  };
}

async function retry() {
  await wait();
  failed.value = { status: "complete", text: "Add the index, then run the query again to compare." };
}
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-6">
    <Message
      aria-label="Assistant message"
      message-role="assistant"
      :status="stopped.status"
      :text="stopped.text"
      :on-continue="resume"
    >
      <MessageContent>{{ stopped.text }}</MessageContent>
      <MessageOutcome />
    </Message>
    <Message
      aria-label="Assistant message"
      message-role="assistant"
      :status="failed.status"
      :text="failed.text"
      error="The model is overloaded. Try again in a moment."
      :on-retry="retry"
    >
      <MessageContent>{{ failed.text }}</MessageContent>
      <MessageOutcome />
    </Message>
  </div>
</template>
