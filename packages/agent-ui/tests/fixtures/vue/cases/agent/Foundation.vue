<script setup lang="ts">
import type { AttachmentItem, UploadItem } from "@kind-ui/agent-ui/core";
import { ref, shallowRef } from "vue";
import { Attachments } from "../../../../../src/vue/attachments.js";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "../../../../../src/vue/composer.js";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "../../../../../src/vue/conversation.js";
import { KindToolbar, KindToolbarButton } from "../../../../../src/vue/internal/toolbar.js";
import { Loader } from "../../../../../src/vue/loader.js";
import { Markdown } from "../../../../../src/vue/markdown.js";
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
} from "../../../../../src/vue/message.js";
import {
  Step,
  StepContent,
  StepIcon,
  StepList,
  StepListItem,
  StepTitle,
  StepTrigger,
} from "../../../../../src/vue/step.js";
import { StreamingText } from "../../../../../src/vue/streaming-text.js";
import { ThinkingIndicator } from "../../../../../src/vue/thinking-indicator.js";
import { TypingIndicator } from "../../../../../src/vue/typing-indicator.js";
import { Uploader } from "../../../../../src/vue/uploader.js";
import { files, filler, question, replies, steps } from "../../../shared/agent.js";
import { commands, mentions } from "../../../shared/composer.js";
import { answer } from "../../../shared/markdown.js";
import { uploads } from "../../../shared/uploader.js";
import { type Details, host } from "./host.js";

const text = ref(question);
const branch = ref(0);
const onBranchChange = (index: number, details: Details) => {
  if (host.change("message", details)) branch.value = index;
};

const items = shallowRef<readonly AttachmentItem[]>(files);
const removeFile = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
};

const uploadItems = shallowRef<readonly UploadItem[]>(uploads);
const { onCancel, onRetry } = host.uploads((change) => {
  uploadItems.value = change(uploadItems.value);
});
</script>

<template>
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="step">
      <StepList aria-label="Agent steps">
        <Step
          v-for="step in steps"
          :key="step.id"
          status="complete"
          :default-open="step.open"
          :onOpenChange="(_open: boolean, details: Details) => host.change('step', details)"
        >
          <StepListItem :value="step.id">
            <template #render="{ props, children }">
              <StepTrigger v-bind="props"><component :is="children" /></StepTrigger>
            </template>
            <StepIcon />
            <StepTitle>{{ step.title }}</StepTitle>
          </StepListItem>
          <StepContent>
            <p>{{ step.body }}</p>
          </StepContent>
        </Step>
      </StepList>
    </section>
    <section data-case="conversation">
      <Conversation aria-label="Chat" :message-count="filler.length + 2" class="h-[24rem]">
        <ConversationViewport>
          <ConversationContent>
            <ConversationRow v-for="(line, index) in filler" :key="line" :value="`f${index}`" :index="index">
              <p>{{ line }}</p>
            </ConversationRow>
            <ConversationRow value="question" :index="filler.length">
              <Message
                aria-label="Question"
                message-role="user"
                :text="text"
                :onEdit="(next: string) => (text = next)"
              >
                <MessageContent>{{ text }}</MessageContent>
                <MessageEditor />
                <MessageToolbar>
                  <KindToolbar aria-label="Question actions">
                    <MessageEdit><KindToolbarButton aria-label="Edit" /></MessageEdit>
                  </KindToolbar>
                </MessageToolbar>
              </Message>
            </ConversationRow>
            <ConversationRow value="reply" :index="filler.length + 1">
              <Message
                aria-label="Reply"
                message-role="assistant"
                :text="replies[branch]"
                :branch-index="branch"
                :branch-count="replies.length"
                :onBranchChange="onBranchChange"
                :onRegenerate="() => host.calls.push('regenerate')"
              >
                <MessageContent>
                  <Markdown :source="branch === 0 ? answer : (replies[branch] as string)" />
                </MessageContent>
                <MessageToolbar>
                  <MessageBranch>
                    <MessageBranchPrevious />
                    <MessageBranchLabel />
                    <MessageBranchNext />
                  </MessageBranch>
                  <KindToolbar aria-label="Reply actions">
                    <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
                    <MessageRegenerate><KindToolbarButton aria-label="Regenerate" /></MessageRegenerate>
                  </KindToolbar>
                </MessageToolbar>
              </Message>
            </ConversationRow>
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump />
      </Conversation>
    </section>
    <section data-case="composer">
      <Composer
        aria-label="Compose"
        :mentions="mentions"
        :commands="commands"
        :onSubmit="host.submit"
        :onStop="host.stop"
        :onValueChange="(_value: unknown, details: Details) => host.change('composer', details)"
      >
        <ComposerAttachments />
        <ComposerInput aria-label="Prompt">
          <ComposerTriggerMenu />
        </ComposerInput>
        <ComposerAttach />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </section>
    <section data-case="attachments">
      <Attachments aria-label="Files" :items="items" :onRemove="removeFile" />
    </section>
    <section data-case="uploader">
      <Uploader aria-label="Uploads" :items="uploadItems" :onCancel="onCancel" :onRetry="onRetry" />
    </section>
    <section data-case="indicators" class="flex flex-col items-start gap-4">
      <Loader />
      <ThinkingIndicator />
      <TypingIndicator />
      <p>
        <StreamingText text="Streaming text fades in" />
      </p>
    </section>
  </div>
</template>
