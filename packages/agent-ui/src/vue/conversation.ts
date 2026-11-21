import { conversationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type Slots, type VNodeChild } from "vue";

const conversation = createParts(conversationPrimitive, {
  root: "div",
  viewport: "div",
  content: "div",
  row: "div",
  jump: "button",
  empty: "div",
  "empty-title": "div",
  "empty-description": "div",
  skeleton: "div",
  loading: "div",
  error: "div",
  "error-icon": "span",
  "error-text": "div",
  retry: "button",
  marks: "div",
  mark: "span",
});

/** Pass `:controller="createConversationController()"` (from `@kind-ui/agent-ui/core`) to scroll it from outside. */
export const Conversation = conversation.Root;
export const ConversationViewport = conversation.Viewport;
/**
 * With `virtualize`, render rows from its state, keyed by index so each measurement stays with its row:
 * `<ConversationContent v-slot="{ state }"><ConversationRow v-for="row in state.rows" :key="row.index" :value="row.key" :index="row.index">…`.
 */
export const ConversationContent = conversation.Content;
export const ConversationRow = conversation.Row;
/** Its text is the new-message count, written by the primitive; render it without children. */
export const ConversationJump = conversation.Jump;
export const ConversationEmpty = conversation.Empty;
export const ConversationEmptyTitle = conversation.EmptyTitle;
export const ConversationEmptyDescription = conversation.EmptyDescription;
/** The error's status mark. Hidden from assistive technology: the words say it. */
export const ConversationErrorIcon = conversation.ErrorIcon;
/**
 * One mark on the track, at `--kind-conversation-mark` (0 to 1) down it. `value` is its step. A Vue component renders
 * again only when its props change, so a host render that keeps the marks renders none of them.
 */
export const ConversationMark = conversation.Mark;

// A part with default children, unless the host passes its own default slot.
const withDefault = <Part extends object>(
  name: string,
  part: Part,
  children: (scope: { state: never }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? children } as Slots);
    },
  }) as unknown as Part;

/** Three placeholder rows while `status` is `"loading"`, unless you pass children. Hidden from assistive technology. */
export const ConversationSkeleton = withDefault("ConversationSkeleton", conversation.Skeleton, () => [
  h("span"),
  h("span"),
  h("span"),
]);

/** The visually hidden status read while `status` is `"loading"`: "Loading conversation", unless you pass children. */
export const ConversationLoading = withDefault(
  "ConversationLoading",
  conversation.Loading,
  () => "Loading conversation",
);

/** The `error` option's words, unless you pass children. */
export const ConversationErrorText = withDefault(
  "ConversationErrorText",
  conversation.ErrorText,
  ({ state }: { state: { error: string | undefined } }) => state.error,
);

/** Calls `onRetry`, shown only while it's set. "Retry", unless you pass children. */
export const ConversationRetry = withDefault("ConversationRetry", conversation.Retry, () => "Retry");

/** Shown while `status` is `"error"`: its mark, its words and Retry, unless you pass children. */
export const ConversationError = withDefault("ConversationError", conversation.Error, () => [
  h(ConversationErrorIcon),
  h(ConversationErrorText),
  h(ConversationRetry),
]);

/**
 * The track beside the scrollbar that shows each message in `marks`, one `ConversationMark` per 4px step that holds
 * one, unless you pass children. Hidden from assistive technology.
 */
export const ConversationMarks = withDefault(
  "ConversationMarks",
  conversation.Marks,
  ({ state }: { state: { marks: readonly number[] } }) =>
    state.marks.map((step) => h(ConversationMark, { key: step, value: String(step) })),
);
