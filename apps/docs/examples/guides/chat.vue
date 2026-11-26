<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { fromUIMessages } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { computed } from "vue";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/vue/composer";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyTitle,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/vue/conversation";
import { Markdown } from "@/components/ui/vue/markdown";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/vue/message";

const chat = new Chat({});
const rendered = computed(() => fromUIMessages(chat.messages, { status: chat.status, error: chat.error }));
</script>

<template>
  <div class="flex h-96 flex-col gap-3">
    <Conversation aria-label="Chat" :message-count="rendered.length" class="min-h-0 flex-1">
      <ConversationViewport>
        <ConversationContent>
          <ConversationRow v-for="(message, index) in rendered" :key="message.id" :value="message.id" :index="index">
            <Message
              :aria-label="message.role === 'user' ? 'Your message' : 'Assistant message'"
              :message-role="message.role"
              :status="message.status"
              :error="message.error?.message"
              :on-retry="() => chat.regenerate()"
            >
              <MessageContent>
                <template v-for="part in message.parts" :key="part.id">
                  <Markdown v-if="part.type === 'text'" :source="part.text" :streaming="part.state === 'streaming'" />
                </template>
              </MessageContent>
              <MessageOutcome />
            </Message>
          </ConversationRow>
          <ConversationEmpty>
            <ConversationEmptyTitle>Ask anything</ConversationEmptyTitle>
          </ConversationEmpty>
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
    <Composer aria-label="Message" :on-submit="(draft) => chat.sendMessage({ text: draft.text })" @stop="chat.stop()">
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <ComposerSubmit />
      <ComposerStop />
    </Composer>
  </div>
</template>
