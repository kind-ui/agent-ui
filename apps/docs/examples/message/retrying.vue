<script setup lang="ts">
import type { MessageStatus } from "@kind-ui/agent-ui";
import { computed, ref, watchEffect } from "vue";
import { Message, MessageContent, MessageRetrying } from "@/components/ui/vue/message";

const text = "Switching to the staging database before the";
const later = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString();

const attempt = ref(1);
const status = ref<MessageStatus>("streaming");
const retryAt = ref(later(5));

// Each try fails until the third, which finishes the answer.
watchEffect((onCleanup) => {
  if (status.value !== "streaming") return;
  const timer = setTimeout(() => {
    if (attempt.value === 3) {
      status.value = "complete";
      return;
    }
    attempt.value += 1;
    retryAt.value = later(5);
  }, Date.parse(retryAt.value) - Date.now());
  onCleanup(() => clearTimeout(timer));
});

const retry = computed(() =>
  status.value === "streaming"
    ? { attempt: attempt.value, maxAttempts: 5, retryAt: retryAt.value, reason: "Rate limited" }
    : undefined,
);
</script>

<template>
  <div class="flex w-full max-w-xl flex-col">
    <Message aria-label="Assistant message" message-role="assistant" :status="status" :text="text" :retry="retry">
      <MessageContent>{{ status === "complete" ? `${text} migrations run.` : text }}</MessageContent>
      <MessageRetrying />
    </Message>
  </div>
</template>
