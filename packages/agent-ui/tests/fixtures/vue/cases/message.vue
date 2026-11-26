<script lang="ts">
export const variants = [
  "all",
  "no-callbacks",
  "chat",
  "options",
  "refusing",
  "author",
  "author-clock",
  "outcomes",
  "custom-rows",
  "delivery",
] as const;
</script>

<script setup lang="ts">
import type { Message as MessageData, MessageStatus, RetryState } from "@kind-ui/agent-ui";
import type { MessageRegenerateDetails } from "@kind-ui/agent-ui/core";
import { computed, onMounted, ref, shallowRef } from "vue";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/vue/conversation.js";
import { KindAvatar, KindAvatarFallback } from "../../../../src/vue/internal/avatar.js";
import { KindMenuItem } from "../../../../src/vue/internal/menu.js";
import { KindToolbar, KindToolbarButton } from "../../../../src/vue/internal/toolbar.js";
import { Markdown } from "../../../../src/vue/markdown.js";
import {
  Message,
  MessageAuthor,
  MessageAvatar,
  MessageBranch,
  MessageBranchLabel,
  MessageBranchNext,
  MessageBranchPrevious,
  MessageContent,
  MessageCopy,
  MessageDelivery,
  MessageDuration,
  MessageEdit,
  MessageEditor,
  MessageHeader,
  MessageOutcome,
  MessageRegenerate,
  MessageRegenerateContent,
  MessageRetrying,
  MessageTime,
  MessageToolbar,
} from "../../../../src/vue/message.js";
import { expose } from "../../shared/expose.js";
import { answer } from "../../shared/markdown.js";
import {
  author,
  authored,
  delivered,
  outcomeError,
  outcomeText,
  regenerateOptions,
  retrying,
  timing,
} from "../../shared/message.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const replies = [
  "Retry with exponential backoff, and cap the number of attempts.",
  "Queue the request and retry it from a background job.",
  "Fail fast and let the caller decide whether to retry.",
];
const question = "How should the client handle a flaky upstream?";

const calls: string[] = [];
const flush = useFlush();

const branch = ref(0);
const assistantText = computed(() => replies[branch.value] as string);
const branchProps = computed(() =>
  props.variant === "all"
    ? {
        branchIndex: branch.value,
        branchCount: replies.length,
        onBranchChange: (index: number) => {
          branch.value = index;
        },
        onRegenerate: () => calls.push("regenerate"),
        onCopy: (value: string) => calls.push(`copy:${value}`),
      }
    : {},
);

const userText = ref(question);
const onEdit = (next: string) => {
  calls.push(`edit:${next}`);
  userText.value = next;
};

const status = ref<MessageStatus>("complete");
const refusing = props.variant === "refusing";
const onRegenerateOption = (_text: string, details: MessageRegenerateDetails) => {
  calls.push(`regenerate:${details.optionId ?? ""}:${details.reason}:${details.source}`);
  if (refusing) details.cancel();
};

const reply = shallowRef<{ text: string; status: MessageStatus }>({ text: "", status: "streaming" });

const authoredRows = authored.map(({ id, text, ...rest }) => ({
  id,
  text,
  rest: { ...rest, ...(props.variant === "author-clock" ? {} : { now: timing.now }) },
}));

type Deferred = { resolve(): void; reject(): void };
const statuses = ref<Record<string, MessageStatus>>({
  stopped: "streaming",
  failed: "streaming",
  earlier: "error",
});
const deferred: Deferred[] = [];
const wait = (name: string) => (details: { reason: string; source: string }) => {
  calls.push(`${name}:${details.reason}:${details.source}`);
  return new Promise<void>((resolve, reject) => deferred.push({ resolve, reject }));
};
const outcomeRows = [
  { id: "stopped", label: "Stopped answer", props: { onContinue: wait("continue") } },
  { id: "failed", label: "Failed answer", props: { onRetry: wait("retry"), error: outcomeError } },
  { id: "earlier", label: "Earlier answer", props: { onRetry: wait("retry") } },
];

const deliveries = ref<Record<string, MessageData["delivery"]>>({ steered: "steered", queued: "queued" });
const retry = shallowRef<RetryState | undefined>(retrying);
const answerStatus = ref<MessageStatus>("streaming");
const withdraw = (details: { reason: string; source: string }) => {
  calls.push(`withdraw:${details.reason}:${details.source}`);
  return new Promise<void>((resolve, reject) => deferred.push({ resolve, reject }));
};
const deliveryRows = [
  { id: "steered", label: "Steered message", props: {} },
  { id: "queued", label: "Queued message", props: { onWithdraw: withdraw } },
] as const;

const withOptions = ["options", "refusing", "custom-rows"].includes(props.variant);

onMounted(() => {
  expose({ kindMessage: { calls } });
  if (withOptions)
    expose({ kindRegenerate: { status: (value: MessageStatus) => flush(() => (status.value = value)) } });
  if (props.variant === "chat")
    expose({
      kindMessage: {
        calls,
        source: answer,
        append: (chunk: string) =>
          flush(() => (reply.value = { ...reply.value, text: reply.value.text + chunk })),
        finish: () => flush(() => (reply.value = { ...reply.value, status: "complete" })),
      },
    });
  if (props.variant === "outcomes")
    expose({
      kindOutcome: {
        calls,
        status: (id: string, value: MessageStatus) =>
          flush(() => (statuses.value = { ...statuses.value, [id]: value })),
        settle: (ok: boolean) => deferred.shift()?.[ok ? "resolve" : "reject"](),
      },
    });
  if (props.variant === "delivery")
    expose({
      kindDelivery: {
        calls,
        deliver: (id: string, value: MessageData["delivery"] | null) =>
          flush(() => (deliveries.value = { ...deliveries.value, [id]: value ?? undefined })),
        retry: (value: RetryState | null) => flush(() => (retry.value = value ?? undefined)),
        status: (value: MessageStatus) => flush(() => (answerStatus.value = value)),
        settle: (ok: boolean) => deferred.shift()?.[ok ? "resolve" : "reject"](),
      },
    });
});
</script>

<template>
  <div v-if="variant === 'all' || variant === 'no-callbacks'" :class="variant === 'all' ? 'm-4 flex w-[36rem] flex-col gap-6' : 'm-4 w-[36rem]'">
    <Message
      v-if="variant === 'all'"
      aria-label="User message"
      message-role="user"
      :text="userText"
      @edit="onEdit"
    >
      <MessageContent>{{ userText }}</MessageContent>
      <MessageEditor />
      <MessageToolbar>
        <KindToolbar aria-label="Message actions">
          <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
          <MessageEdit><KindToolbarButton aria-label="Edit" /></MessageEdit>
        </KindToolbar>
      </MessageToolbar>
    </Message>
    <Message aria-label="Assistant message" message-role="assistant" :text="assistantText" v-bind="branchProps">
      <MessageAvatar>
        <KindAvatar><KindAvatarFallback>AI</KindAvatarFallback></KindAvatar>
      </MessageAvatar>
      <MessageContent>
        <Markdown :source="assistantText" />
      </MessageContent>
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
  <Conversation
    v-else-if="variant === 'chat'"
    aria-label="Conversation"
    :message-count="2"
    class="m-4 h-[40rem] w-[44rem] rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        <ConversationRow value="q" :index="0">
          <Message aria-label="User message" message-role="user" :text="userText" @edit="onEdit">
            <MessageContent>{{ userText }}</MessageContent>
            <MessageEditor />
            <MessageToolbar>
              <KindToolbar aria-label="Message actions">
                <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
                <MessageEdit><KindToolbarButton aria-label="Edit" /></MessageEdit>
              </KindToolbar>
            </MessageToolbar>
          </Message>
        </ConversationRow>
        <ConversationRow value="a" :index="1">
          <Message
            aria-label="Assistant message"
            message-role="assistant"
            :status="reply.status"
            :text="reply.text"
            @regenerate="calls.push('regenerate')"
          >
            <MessageContent>
              <Markdown :source="reply.text" :streaming="reply.status === 'streaming'" />
            </MessageContent>
            <MessageToolbar>
              <KindToolbar aria-label="Message actions">
                <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
                <MessageRegenerate><KindToolbarButton aria-label="Regenerate" /></MessageRegenerate>
              </KindToolbar>
            </MessageToolbar>
          </Message>
        </ConversationRow>
      </ConversationContent>
    </ConversationViewport>
  </Conversation>
  <div v-else-if="withOptions" class="m-4 w-[36rem]">
    <Message
      aria-label="Assistant message"
      :status="status"
      :text="replies[0]"
      :regenerate-options="regenerateOptions"
      @regenerate="onRegenerateOption"
    >
      <MessageContent>{{ replies[0] }}</MessageContent>
      <MessageToolbar>
        <KindToolbar aria-label="Message actions">
          <MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>
          <MessageRegenerate>
            <KindToolbarButton aria-label="Regenerate" />
            <template v-if="variant === 'custom-rows'" #menuContent>
              <MessageRegenerateContent v-slot="{ state }">
                <KindMenuItem v-for="option in state.options" :key="option.id" :value="option.id" :label="option.label">
                  {{ option.label.toUpperCase() }}
                </KindMenuItem>
              </MessageRegenerateContent>
            </template>
          </MessageRegenerate>
        </KindToolbar>
      </MessageToolbar>
    </Message>
  </div>
  <div v-else-if="variant === 'author' || variant === 'author-clock'" class="m-4 flex w-[36rem] flex-col gap-2">
    <Message
      v-for="row in authoredRows"
      :id="row.id"
      :key="row.id"
      :aria-label="`Message ${row.id}`"
      :text="row.text"
      :author="author"
      :time-zone="timing.timeZone"
      v-bind="row.rest"
    >
      <MessageAvatar />
      <MessageHeader>
        <MessageAuthor />
        <MessageTime />
        <MessageDuration />
      </MessageHeader>
      <MessageContent>{{ row.text }}</MessageContent>
    </Message>
  </div>
  <div v-else-if="variant === 'outcomes'" class="m-4 flex w-[36rem] flex-col gap-6">
    <Message
      v-for="row in outcomeRows"
      :id="row.id"
      :key="row.id"
      :aria-label="row.label"
      :status="statuses[row.id]"
      :text="outcomeText"
      v-bind="row.props"
    >
      <MessageContent>{{ outcomeText }}</MessageContent>
      <MessageOutcome />
    </Message>
    <input aria-label="Reply" class="w-full" />
  </div>
  <div v-else-if="variant === 'delivery'" class="m-4 flex w-[36rem] flex-col gap-6">
    <Message
      v-for="row in deliveryRows"
      :id="row.id"
      :key="row.id"
      :aria-label="row.label"
      message-role="user"
      :text="delivered[row.id]"
      :delivery="deliveries[row.id]"
      v-bind="row.props"
    >
      <MessageHeader>
        <MessageDelivery />
      </MessageHeader>
      <MessageContent>{{ delivered[row.id] }}</MessageContent>
    </Message>
    <Message
      id="answer"
      aria-label="Retrying answer"
      :status="answerStatus"
      :text="delivered.answer"
      :retry="retry"
      @retry="calls.push('retry')"
    >
      <MessageContent>{{ delivered.answer }}</MessageContent>
      <MessageRetrying />
      <MessageOutcome />
    </Message>
    <input aria-label="Reply" class="w-full" />
  </div>
</template>
