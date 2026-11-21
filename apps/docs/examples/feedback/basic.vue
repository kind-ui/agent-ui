<script setup lang="ts">
import { shallowRef } from "vue";
import { Feedback } from "@/components/ui/vue/feedback";
import { KindToolbar, KindToolbarButton } from "@/components/ui/vue/internal/toolbar";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "@/components/ui/vue/message";

const reply = "Retry with exponential backoff, and cap the number of attempts.";

const commentSent = shallowRef(false);

function comment() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      commentSent.value = true;
      resolve();
    }, 600);
  });
}
</script>

<template>
  <Message aria-label="Assistant message" message-role="assistant" :text="reply" class="w-full max-w-xl">
    <MessageContent>{{ reply }}</MessageContent>
    <MessageToolbar>
      <KindToolbar aria-label="Message actions">
        <MessageCopy>
          <KindToolbarButton aria-label="Copy" />
        </MessageCopy>
      </KindToolbar>
      <Feedback :comment-sent="commentSent" :on-comment="comment" />
    </MessageToolbar>
  </Message>
</template>
