<script setup lang="ts">
import { computed, ref } from "vue";
import { KindToolbar, KindToolbarButton } from "@/components/ui/vue/internal/toolbar";
import {
  Message,
  MessageBranch,
  MessageBranchLabel,
  MessageBranchNext,
  MessageBranchPrevious,
  MessageContent,
  MessageCopy,
  MessageEdit,
  MessageEditor,
  MessageRegenerate,
  MessageToolbar,
} from "@/components/ui/vue/message";

const replies = [
  "Retry with exponential backoff, and cap the number of attempts.",
  "Queue the request and retry it from a background job.",
  "Fail fast and let the caller decide whether to retry.",
];

const question = ref("How should the client handle a flaky upstream?");
const branches = ref({ index: 0, count: 2 });
const reply = computed(() => replies[branches.value.index] as string);

function regenerate() {
  const count = Math.min(branches.value.count + 1, replies.length);
  branches.value = { index: count - 1, count };
}
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-6">
    <Message aria-label="User message" message-role="user" :text="question" @edit="(text) => (question = text)">
      <MessageContent>{{ question }}</MessageContent>
      <MessageEditor />
      <MessageToolbar>
        <KindToolbar aria-label="Message actions">
          <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
          <MessageEdit><KindToolbarButton aria-label="Edit" /></MessageEdit>
        </KindToolbar>
      </MessageToolbar>
    </Message>
    <Message
      aria-label="Assistant message"
      message-role="assistant"
      :text="reply"
      :branch-index="branches.index"
      :branch-count="branches.count"
      @branch-change="(index) => (branches = { ...branches, index })"
      @regenerate="regenerate"
    >
      <MessageContent>{{ reply }}</MessageContent>
      <MessageToolbar>
        <MessageBranch>
          <MessageBranchPrevious />
          <MessageBranchLabel />
          <MessageBranchNext />
        </MessageBranch>
        <KindToolbar aria-label="Message actions">
          <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
          <MessageRegenerate><KindToolbarButton aria-label="Regenerate" /></MessageRegenerate>
        </KindToolbar>
      </MessageToolbar>
    </Message>
  </div>
</template>
