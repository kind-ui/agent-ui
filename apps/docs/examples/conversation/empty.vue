<script setup lang="ts">
import { shallowRef } from "vue";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyDescription,
  ConversationEmptyTitle,
  ConversationViewport,
} from "@/components/ui/vue/conversation";
import { Suggestion } from "@/components/ui/vue/suggestion";

const suggestions = [
  { id: "summarize", label: "Summarize this repository" },
  { id: "issues", label: "Find good first issues" },
  { id: "tests", label: "Explain the failing test" },
];

const prompt = shallowRef<string>();

function pick(id: string) {
  prompt.value = suggestions.find((suggestion) => suggestion.id === id)?.label;
}
</script>

<template>
  <Conversation
    aria-label="Conversation"
    :message-count="0"
    class="h-96 w-full max-w-xl rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        <ConversationEmpty>
          <ConversationEmptyTitle>Ask about kind-ui/agent-ui</ConversationEmptyTitle>
          <ConversationEmptyDescription>
            {{ prompt ? `Sent: ${prompt}` : "Start from a suggestion, or ask your own question." }}
          </ConversationEmptyDescription>
          <Suggestion layout="wrap" :suggestions="suggestions" @pick="pick" />
        </ConversationEmpty>
      </ConversationContent>
    </ConversationViewport>
  </Conversation>
</template>
