<script setup lang="ts">
import type { MessageStatus, RetryState } from "@kind-ui/agent-ui";
import { ref, watchEffect } from "vue";
import { Message, MessageContent, MessageOutcome, MessageRetrying } from "@/components/ui/vue/message";

const text = "Retry with exponential backoff, and cap the number of attempts. The client should";
const first: RetryState = { attempt: 1, maxAttempts: 3, retryAfter: 4, reason: "Rate limited" };

const status = ref<MessageStatus>("streaming");
const retry = ref<RetryState | undefined>(first);

function next() {
  const current = retry.value;
  if (!current) return;
  if (current.attempt === current.maxAttempts) status.value = "error";
  else retry.value = { ...current, attempt: current.attempt + 1 };
}

// Each attempt fails here, once its countdown ends.
watchEffect((onCleanup) => {
  if (status.value !== "streaming" || !retry.value) return;
  const timer = setTimeout(next, (retry.value.retryAfter ?? 0) * 1000);
  onCleanup(() => clearTimeout(timer));
});

function cancel() {
  retry.value = undefined;
  status.value = "aborted";
}

function again() {
  retry.value = first;
  status.value = "streaming";
}
</script>

<template>
  <div class="w-full max-w-xl">
    <Message
      aria-label="Assistant message"
      :status="status"
      :text="text"
      :retry="retry"
      :on-retry-now="next"
      :on-cancel-retry="cancel"
      :on-retry="again"
    >
      <MessageContent>{{ text }}</MessageContent>
      <MessageRetrying />
      <MessageOutcome />
    </Message>
  </div>
</template>
