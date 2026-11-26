<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import type { ToolCall } from "@kind-ui/agent-ui";
import { fromUIMessages, toApprovalResponse } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
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
import { Message, MessageContent } from "@/components/ui/vue/message";
import { Reasoning } from "@/components/ui/vue/reasoning";
import { Tool } from "@/components/ui/vue/tool";

const chat = new Chat({ sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses });
const rendered = computed(() => fromUIMessages(chat.messages, { status: chat.status, error: chat.error }));

function respond(call: ToolCall, approved: boolean) {
  if (call.approval) chat.addToolApprovalResponse(toApprovalResponse(call.approval, { approved }));
}
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
            >
              <MessageContent>
                <template v-for="part in message.parts" :key="part.id">
                  <Markdown v-if="part.type === 'text'" :source="part.text" :streaming="part.state === 'streaming'" />
                  <Reasoning
                    v-else-if="part.type === 'reasoning'"
                    :status="part.state === 'streaming' ? 'running' : 'complete'"
                    :text="part.text"
                  />
                  <Tool
                    v-else-if="part.type === 'step' && part.step.kind === 'tool'"
                    :call="part.step.call"
                    :error="part.step.error"
                    @approve="respond(part.step.call, true)"
                    @deny="respond(part.step.call, false)"
                  />
                </template>
              </MessageContent>
            </Message>
          </ConversationRow>
          <ConversationEmpty>
            <ConversationEmptyTitle>Ask the agent to clean up merged branches</ConversationEmptyTitle>
          </ConversationEmpty>
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
    <Composer aria-label="Message" :on-submit="(draft) => chat.sendMessage({ text: draft.text })" @stop="chat.stop()">
      <ComposerInput aria-label="Prompt" placeholder="Clean up merged branches" />
      <ComposerSubmit />
      <ComposerStop />
    </Composer>
  </div>
</template>
