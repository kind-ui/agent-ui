<script setup lang="ts">
import { isContinuation } from "@kind-ui/agent-ui/core";
import {
  Message,
  MessageAuthor,
  MessageAvatar,
  MessageContent,
  MessageDuration,
  MessageHeader,
  MessageTime,
} from "@/components/ui/vue/message";

const assistant = { id: "assistant", name: "Build Assistant" };

const first = {
  author: assistant,
  createdAt: "2026-11-17T09:41:00Z",
  durationSeconds: 4,
  text: "The deploy failed because the migration timed out.",
};

const second = {
  author: assistant,
  createdAt: "2026-11-17T09:42:30Z",
  durationSeconds: 72,
  text: "I split the migration into batches of 1,000 rows, and the deploy passed.",
};
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-4">
    <Message
      v-for="(message, index) in [first, second]"
      :key="message.createdAt"
      aria-label="Assistant message"
      message-role="assistant"
      :text="message.text"
      :author="message.author"
      :continued="index > 0 && isContinuation(first, message)"
      :created-at="message.createdAt"
      :duration-seconds="message.durationSeconds"
      time-zone="UTC"
    >
      <MessageAvatar />
      <MessageHeader>
        <MessageAuthor />
        <MessageTime />
        <MessageDuration />
      </MessageHeader>
      <MessageContent>{{ message.text }}</MessageContent>
    </Message>
  </div>
</template>
