<script setup lang="ts">
import { createConversationController } from "@kind-ui/agent-ui/core";
import { shallowRef } from "vue";
import { ConnectionStatus } from "../../../../../src/vue/connection-status.js";
import {
  Conversation,
  ConversationContent,
  ConversationError,
  ConversationLoading,
  ConversationMarks,
  ConversationRow,
  ConversationSkeleton,
  ConversationViewport,
} from "../../../../../src/vue/conversation.js";
import { ConversationSearch } from "../../../../../src/vue/conversation-search.js";
import { DaySeparator } from "../../../../../src/vue/day-separator.js";
import {
  Message,
  MessageAuthor,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageOutcome,
} from "../../../../../src/vue/message.js";
import { ShareDialog } from "../../../../../src/vue/share-dialog.js";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "../../../../../src/vue/sidebar.js";
import { ThreadList } from "../../../../../src/vue/thread-list.js";
import { ThreadSearch } from "../../../../../src/vue/thread-search.js";
import { shellMessages } from "../../../shared/agent.js";
import { author, outcomeError, outcomeText } from "../../../shared/message.js";
import { shareLink } from "../../../shared/share-dialog.js";
import { NOW, threads } from "../../../shared/thread-list.js";
import { type Details, host } from "./host.js";

defineProps<{ confirm: boolean }>();

const link = shallowRef<string | undefined>();
const controller = createConversationController();
const marks = shallowRef<readonly number[]>([]);
const history = shallowRef<"error" | "loading">("error");
const change = (component: string) => (_value: unknown, details: Details) => host.change(component, details);
const settle = (action: string, set: string | undefined) => (details: { source: string }) =>
  host
    .decide(action)(details)
    .then(() => {
      link.value = set;
    });
const retryHistory = (details: { source: string }) =>
  host
    .decide("conversation-retry")(details)
    .then(() => {
      history.value = "loading";
    });
const setMarks = (next: readonly number[]) => {
  marks.value = next;
};
</script>

<template>
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section id="thread-list" data-case="thread-list" class="flex h-[22rem] flex-col">
      <ThreadList
        :threads="threads"
        value="t2"
        :now="NOW"
        time-zone="UTC"
        :onSelect="change('thread-select')"
        :onNew="host.decide('thread-new')"
        :onRename="host.decide('thread-rename')"
        :onPinChange="host.decide('thread-pin')"
        :onShare="host.decide('thread-share')"
        :onDelete="host.decide('thread-delete')"
      />
    </section>
    <section id="thread-search" data-case="thread-search">
      <ThreadSearch
        :threads="threads"
        :now="NOW"
        time-zone="UTC"
        :onOpenChange="change('thread-search')"
        :onQueryChange="change('thread-search-query')"
        :onSelect="change('thread-search-select')"
        :onNew="host.decide('thread-search-new')"
      />
    </section>
    <section id="sidebar" data-case="sidebar">
      <Sidebar label="History" class="h-48" :onOpenChange="change('sidebar')">
        <SidebarPanel>
          <p class="p-2">Earlier chats</p>
        </SidebarPanel>
        <SidebarHandle />
        <SidebarInset>
          <SidebarTrigger />
        </SidebarInset>
      </Sidebar>
    </section>
    <section id="share" data-case="share-dialog">
      <ShareDialog
        default-visibility="link"
        :link="link"
        :agent-confirm="confirm"
        :onOpenChange="change('share')"
        :onVisibilityChange="change('share-visibility')"
        :onCreateLink="settle('share-create', shareLink)"
        :onRevoke="settle('share-revoke', undefined)"
        :onCopy="host.decide('share-copy')"
      />
    </section>
    <section id="day" data-case="day-separator">
      <DaySeparator date="2026-11-18T09:30:00Z" time-zone="UTC" />
    </section>
    <section id="failed" data-case="message">
      <Message
        aria-label="Failed answer"
        message-role="assistant"
        status="error"
        :error="outcomeError"
        :text="outcomeText"
        :author="author"
        :onRetry="host.decide('message-retry')"
      >
        <MessageAvatar />
        <MessageHeader>
          <MessageAuthor />
        </MessageHeader>
        <MessageContent>{{ outcomeText }}</MessageContent>
        <MessageOutcome />
      </Message>
    </section>
    <section id="earlier" data-case="conversation">
      <Conversation
        aria-label="Earlier chat"
        :message-count="0"
        :status="history"
        :onRetry="retryHistory"
        class="h-40"
      >
        <ConversationViewport>
          <ConversationContent>
            <ConversationSkeleton />
            <ConversationLoading />
            <ConversationError />
          </ConversationContent>
        </ConversationViewport>
      </Conversation>
    </section>
    <section id="connection" data-case="connection-status" class="relative h-16">
      <ConnectionStatus state="offline" :onRetry="host.decide('connection-retry')" />
    </section>
    <section id="find" data-case="conversation-search" class="relative">
      <ConversationSearch
        :messages="shellMessages"
        :conversation="controller"
        default-open
        motion="none"
        :onMarksChange="setMarks"
        :onQueryChange="change('find-query')"
        :onOpenChange="change('find')"
      />
      <Conversation
        aria-label="Found chat"
        :message-count="shellMessages.length"
        :controller="controller"
        :marks="marks"
        motion="none"
        class="h-48"
      >
        <ConversationViewport>
          <ConversationContent>
            <ConversationRow
              v-for="(message, index) in shellMessages"
              :key="message.id"
              :value="message.id"
              :index="index"
            >
              <p>{{ message.text }}</p>
            </ConversationRow>
          </ConversationContent>
        </ConversationViewport>
        <ConversationMarks />
      </Conversation>
    </section>
  </div>
</template>
