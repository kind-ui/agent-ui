<script lang="ts">
import { type ConversationStatus, createConversationController } from "@kind-ui/agent-ui/core";
import { defineComponent, h, onMounted, type PropType, shallowRef } from "vue";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyDescription,
  ConversationEmptyTitle,
  ConversationError,
  ConversationJump,
  ConversationLoading,
  ConversationRow,
  ConversationSkeleton,
  ConversationViewport,
} from "../../../../src/vue/conversation.js";
import { type ConversationStates, retryRecorder } from "../../shared/conversation.js";
import { expose } from "../../shared/expose.js";
import { useFlush } from "./flush.js";

export const variants = [
  "chat",
  "empty",
  "chat-10",
  "chat-500",
  "virtual",
  "remount",
  "loading",
  "error",
  "error-plain",
  "welcome",
] as const;

type Message = { id: string; role: "user" | "assistant"; text: string };

const lines = [
  "How do I keep a chat scrolled to the newest reply?",
  "Follow the end while the reader is at the bottom, and let go the moment they scroll up. A jump control brings them back, with a count of what arrived while they were away.",
  "And long histories?",
  "Render only the rows in view and measure each one as it mounts, so the scrollbar stays steady.",
];

const message = (serial: number, prefix = "m"): Message => ({
  id: `${prefix}${serial}`,
  role: serial % 2 === 0 ? "user" : "assistant",
  text: lines[serial % lines.length] as string,
});
const messages = (from: number, count: number, prefix?: string) =>
  Array.from({ length: count }, (_, i) => message(from + i, prefix));

const bubble = (m: Message) =>
  m.role === "user"
    ? h(
        "p",
        {
          "data-message": m.id,
          class: "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2",
        },
        m.text,
      )
    : h("p", { "data-message": m.id }, m.text);

const Row = defineComponent({
  name: "Row",
  props: {
    message: { type: Object as PropType<Message>, required: true },
    index: { type: Number, required: true },
  },
  setup(props) {
    return () =>
      h(ConversationRow, { value: props.message.id, index: props.index }, () => bubble(props.message));
  },
});

const Chat = defineComponent({
  name: "Chat",
  props: { count: { type: Number, required: true }, virtualize: Boolean },
  setup(props) {
    const all = shallowRef(messages(0, props.count));
    const controller = createConversationController();
    onMounted(() => {
      let appended = props.count;
      let older = 0;
      expose({
        kindConversation: {
          append: (n = 1) => {
            const added = messages(appended, n);
            appended += n;
            all.value = [...all.value, ...added];
          },
          prepend: (n = 1) => {
            const added = messages(older, n, "o");
            older += n;
            controller.prepend();
            all.value = [...added, ...all.value];
          },
          stream: (chunk: string) => {
            const list = all.value;
            all.value = list.map((m, i) => (i === list.length - 1 ? { ...m, text: m.text + chunk } : m));
          },
          remove: (n = 1) => {
            all.value = all.value.slice(0, -n);
          },
        },
      });
    });
    const row = (m: Message, index: number, key: string | number = m.id) =>
      h(Row, { key, message: m, index });
    return () =>
      h(
        Conversation,
        {
          "aria-label": "Conversation",
          messageCount: all.value.length,
          virtualize: props.virtualize,
          rowKey: (index: number) => all.value[index]?.id ?? String(index),
          controller,
          class: "m-4 h-[28rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]",
        },
        () => [
          h(ConversationViewport, null, () =>
            h(ConversationContent, null, {
              default: props.virtualize
                ? ({ state }: { state: { rows: { index: number }[] } }) =>
                    state.rows.flatMap((r) => {
                      const m = all.value[r.index];
                      return m ? [row(m, r.index, r.index)] : [];
                    })
                : () => [
                    ...all.value.map((m, i) => row(m, i)),
                    h(ConversationEmpty, { key: "empty" }, () => "No messages yet."),
                  ],
            }),
          ),
          h(ConversationJump),
        ],
      );
  },
});

const Remount = defineComponent({
  name: "Remount",
  setup() {
    const shown = shallowRef(true);
    const flush = useFlush();
    onMounted(() => expose({ kindRemount: () => flush(() => (shown.value = !shown.value)) }));
    return () => (shown.value ? h(Chat, { count: 31 }) : null);
  },
});

type View = { status: ConversationStatus; count: number; error?: string };

const States = defineComponent({
  name: "States",
  props: {
    initial: { type: String as PropType<ConversationStatus>, required: true },
    canRetry: { type: Boolean, default: true },
  },
  setup(props) {
    const view = shallowRef<View>({ status: props.initial, count: 0 });
    const retry = retryRecorder();
    onMounted(() => {
      const states: ConversationStates = {
        set: (status, count = 0, error) => {
          view.value = { status, count, ...(error !== undefined && { error }) };
        },
        resolveRetry: retry.resolveRetry,
        rejectRetry: retry.rejectRetry,
        retries: retry.retries,
      };
      expose({ kindConversationStates: states });
    });
    return () =>
      h(
        Conversation,
        {
          "aria-label": "Conversation",
          messageCount: view.value.count,
          status: view.value.status,
          ...(view.value.error !== undefined && { error: view.value.error }),
          ...(props.canRetry && { onRetry: retry.onRetry }),
          class:
            "m-4 h-[28rem] w-[32rem] max-w-[calc(100%-2rem)] rounded-xl border border-[var(--kind-color-border)]",
        },
        () => [
          h(ConversationViewport, null, () =>
            h(ConversationContent, null, () => [
              ...messages(0, view.value.count).map((m, i) => h(Row, { key: m.id, message: m, index: i })),
              h(ConversationSkeleton),
              h(ConversationLoading),
              h(ConversationError),
              h(ConversationEmpty, null, () => [
                h(ConversationEmptyTitle, null, () => "What can I help with?"),
                h(
                  ConversationEmptyDescription,
                  null,
                  () => "Ask about your code, your docs or your last deploy.",
                ),
              ]),
            ]),
          ),
          h(ConversationJump),
        ],
      );
  },
});
</script>

<script setup lang="ts">
defineProps<{ variant: string; params: URLSearchParams }>();
</script>

<template>
  <Chat v-if="variant === 'chat'" :count="31" />
  <Chat v-else-if="variant === 'empty'" :count="0" />
  <Chat v-else-if="variant === 'chat-10'" :count="10" />
  <Chat v-else-if="variant === 'chat-500'" :count="500" />
  <Chat v-else-if="variant === 'virtual'" :count="1000" virtualize />
  <Remount v-else-if="variant === 'remount'" />
  <States v-else-if="variant === 'loading'" initial="loading" />
  <States v-else-if="variant === 'error'" initial="error" />
  <States v-else-if="variant === 'error-plain'" initial="error" :can-retry="false" />
  <States v-else-if="variant === 'welcome'" initial="ready" />
</template>
