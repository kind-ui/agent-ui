<script setup lang="ts">
import type { MessageRegenerateDetails } from "@kind-ui/agent-ui/core";
import { ref } from "vue";
import { KindToolbar, KindToolbarButton } from "@/components/ui/vue/internal/toolbar";
import {
  Message,
  MessageContent,
  MessageCopy,
  MessageRegenerate,
  MessageToolbar,
} from "@/components/ui/vue/message";

const reply = "Retry with exponential backoff, and cap the number of attempts.";

const regenerateOptions = [
  { id: "details", label: "Add details" },
  { id: "concise", label: "More concise", description: "Keep it to one sentence" },
  {
    id: "model",
    label: "Try with another model",
    items: [
      { id: "model-fast", label: "Fast model" },
      { id: "model-deep", label: "Deep model" },
    ],
  },
];

const chosen = ref("Nothing yet");
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-3">
    <Message
      aria-label="Assistant message"
      message-role="assistant"
      :text="reply"
      :regenerate-options="regenerateOptions"
      @regenerate="(_text: string, { optionId }: MessageRegenerateDetails) => (chosen = optionId ?? 'Try again')"
    >
      <MessageContent>{{ reply }}</MessageContent>
      <MessageToolbar>
        <KindToolbar aria-label="Message actions">
          <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
          <MessageRegenerate><KindToolbarButton aria-label="Regenerate" /></MessageRegenerate>
        </KindToolbar>
      </MessageToolbar>
    </Message>
    <p class="text-sm text-[var(--kind-color-muted)]">Last regenerated with: {{ chosen }}</p>
  </div>
</template>
