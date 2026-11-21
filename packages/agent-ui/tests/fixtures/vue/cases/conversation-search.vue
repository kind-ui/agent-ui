<script lang="ts">
import { type ConversationSearchMessage, createConversationController } from "@kind-ui/agent-ui/core";
import { defineComponent, h, onMounted, type PropType, shallowRef } from "vue";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationMarks,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/vue/conversation.js";
import { ConversationSearch } from "../../../../src/vue/conversation-search.js";
import { Markdown } from "../../../../src/vue/markdown.js";
import { markdownMessage, type SearchRecord, searchMessages } from "../../shared/conversation-search.js";
import { expose } from "../../shared/expose.js";

export const variants = ["basic", "refused", "preset", "markdown", "many-100", "many-5000"] as const;

const recorded: SearchRecord = { queries: [], opens: [] };

// Its own component, so a new search renders no message whose props stayed the same, as React's `memo` row.
const Row = defineComponent({
  name: "Row",
  props: {
    message: { type: Object as PropType<ConversationSearchMessage>, required: true },
    index: { type: Number, required: true },
  },
  setup(props) {
    return () =>
      h(ConversationRow, { value: props.message.id, index: props.index }, () =>
        props.message.id === "md"
          ? h(Markdown, { source: props.message.text })
          : h("p", { class: "truncate", "data-message": props.message.id }, props.message.text),
      );
  },
});

const Search = defineComponent({
  name: "Search",
  props: {
    messages: { type: Array as PropType<ConversationSearchMessage[]>, required: true },
    virtualize: Boolean,
    controlled: Boolean,
    defaultQuery: { type: String, default: undefined },
    refused: Boolean,
  },
  setup(props) {
    const controller = createConversationController();
    const marks = shallowRef<readonly number[]>([]);
    const query = shallowRef("");
    onMounted(() =>
      expose({ kindHost: recorded, kindSearch: { set: (next: string) => (query.value = next) } }),
    );
    return () => {
      const { messages } = props;
      return h("div", { class: "flex flex-col gap-3 bg-[var(--kind-color-surface)] p-4" }, [
        h("button", { type: "button", id: "before" }, "Before"),
        h("div", { class: "relative w-[32rem]" }, [
          h(ConversationSearch, {
            messages,
            conversation: controller,
            defaultOpen: true,
            shortcut: "mod+f",
            motion: "none",
            onMarksChange: (next: readonly number[]) => {
              marks.value = next;
            },
            onQueryChange: (next: string, details: { reason: string }) => {
              recorded.queries.push([next, details.reason]);
              if (props.controlled && !props.refused) query.value = next;
            },
            onOpenChange: (open: boolean, details: { reason: string }) =>
              recorded.opens.push([open, details.reason]),
            ...(props.controlled && { query: query.value }),
            ...(props.defaultQuery !== undefined && { defaultQuery: props.defaultQuery }),
          }),
          h(
            Conversation,
            {
              "aria-label": "Conversation",
              messageCount: messages.length,
              virtualize: props.virtualize,
              estimateRowHeight: 48,
              rowKey: (index: number) => messages[index]?.id ?? String(index),
              controller,
              marks: marks.value,
              motion: "none",
              class: "h-[480px] rounded-xl",
            },
            () => [
              h(ConversationViewport, null, () =>
                h(ConversationContent, null, {
                  default: props.virtualize
                    ? ({ state }: { state: { rows: { index: number }[] } }) =>
                        state.rows.flatMap((r) => {
                          const message = messages[r.index];
                          return message ? [h(Row, { key: r.index, message, index: r.index })] : [];
                        })
                    : () => messages.map((message, index) => h(Row, { key: message.id, message, index })),
                }),
              ),
              h(ConversationJump),
              h(ConversationMarks),
            ],
          ),
        ]),
      ]);
    };
  },
});
</script>

<script setup lang="ts">
defineProps<{ variant: string; params: URLSearchParams }>();
</script>

<template>
  <Search v-if="variant === 'basic'" :messages="searchMessages(50)" />
  <Search v-else-if="variant === 'refused'" :messages="searchMessages(50)" controlled refused />
  <Search v-else-if="variant === 'preset'" :messages="searchMessages(50)" default-query="rollout" />
  <Search v-else-if="variant === 'markdown'" :messages="[...searchMessages(3), markdownMessage]" />
  <Search v-else-if="variant === 'many-100'" :messages="searchMessages(100)" virtualize controlled />
  <Search v-else-if="variant === 'many-5000'" :messages="searchMessages(5000)" virtualize controlled />
</template>
