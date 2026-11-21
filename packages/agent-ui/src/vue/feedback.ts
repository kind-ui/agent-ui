import {
  type FeedbackCommentTextState,
  type FeedbackThumbsState,
  feedbackPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { Toggle, ToggleGroup, ToggleIcon } from "@ui-sdk/vue/toggle";
import { type Component, defineComponent, h, type Slots } from "vue";
import { KindTextarea } from "./internal/textarea.js";

const parts = createParts(feedbackPrimitive, {
  root: "div",
  thumbs: "div",
  comment: "button",
  thanks: "span",
  content: "div",
  title: "h2",
  "comment-text": "div",
  "comment-send": "button",
  "comment-status": "span",
  "comment-status-icon": "span",
  "comment-error": "span",
});

// A part whose default slot falls back to `fallback` when the caller fills none.
function withDefault<C extends Component>(part: C, name: string, fallback: (scope: never) => unknown): C {
  const Part = defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? fallback } as Slots);
    },
  });
  return Part as unknown as C;
}

/** "Good response": a Toggle whose value is `"up"`. */
export const FeedbackUp = defineComponent({
  name: "FeedbackUp",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        Toggle,
        {
          value: "up",
          "aria-label": "Good response",
          "data-kind-icon-button": "",
          "data-kind-size": "sm",
          ...attrs,
        },
        { ...slots, default: slots.default ?? (() => h(ToggleIcon, { "data-feedback-icon": "up" })) },
      );
  },
}) as unknown as typeof Toggle;

/** "Bad response": a Toggle whose value is `"down"`. */
export const FeedbackDown = defineComponent({
  name: "FeedbackDown",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        Toggle,
        {
          value: "down",
          "aria-label": "Bad response",
          "data-kind-icon-button": "",
          "data-kind-size": "sm",
          ...attrs,
        },
        { ...slots, default: slots.default ?? (() => h(ToggleIcon, { "data-feedback-icon": "down" })) },
      );
  },
}) as unknown as typeof Toggle;

/** UI SDK's Toggle group, holding the thumbs unless you fill its slot. One Tab stop, with arrow keys between. */
export const FeedbackThumbs = defineComponent({
  name: "FeedbackThumbs",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Thumbs, attrs, {
        ...slots,
        default: ({ state }: { state: FeedbackThumbsState }) =>
          // Hidden from agents, which use the Feedback's own `rate`.
          h(
            ToggleGroup,
            {
              controller: state.controller,
              defaultValue: state.defaultValue,
              "aria-label": state["aria-label"],
              "data-agent-hidden": "",
            },
            () => slots.default?.() ?? [h(FeedbackUp), h(FeedbackDown)],
          ),
      });
  },
}) as unknown as typeof parts.Thumbs;

/** "Add a comment", unless you fill its slot. Opens the comment box. Rendered once there's a rating and `onComment`. */
export const FeedbackComment = withDefault(parts.Comment, "FeedbackComment", () => "Add a comment");

/** "Thanks for your feedback", unless you fill its slot. Rendered while `commentSent` is set. */
export const FeedbackThanks = withDefault(parts.Thanks, "FeedbackThanks", () => "Thanks for your feedback");

/** "Add a comment", unless you fill its slot. Names the comment box; the styles keep it for assistive technology only. */
export const FeedbackTitle = withDefault(parts.Title, "FeedbackTitle", () => "Add a comment");

/**
 * UI SDK's Textarea, unless you fill its slot, which gets its props as `state` (`<textarea v-bind="state">`), its
 * placeholder keyed on the rating.
 */
export const FeedbackCommentText = defineComponent({
  name: "FeedbackCommentText",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.CommentText, attrs, {
        ...slots,
        default: ({ state }: { state: FeedbackCommentTextState }) => {
          // The slot's state is a proxy that tracks each key read and lists none, so it's copied key by key for a
          // slot that binds it with `v-bind`.
          const props: FeedbackCommentTextState = {
            controller: state.controller,
            defaultValue: state.defaultValue,
            readOnly: state.readOnly,
            placeholder: state.placeholder,
            "aria-label": state["aria-label"],
          };
          return slots.default ? slots.default({ state: props }) : h(KindTextarea, { ...props, rows: 3 });
        },
      });
  },
}) as unknown as typeof parts.CommentText;

/** Sends the comment through `onComment`. Reads "Send" unless you fill its slot. */
export const FeedbackCommentSend = withDefault(parts.CommentSend, "FeedbackCommentSend", () => "Send");

export const FeedbackCommentStatusIcon = parts.CommentStatusIcon;

/** A running mark and "Sending" while `onComment` is pending, unless you fill its slot. */
export const FeedbackCommentStatus = withDefault(parts.CommentStatus, "FeedbackCommentStatus", () => [
  h(FeedbackCommentStatusIcon),
  "Sending",
]);

/** "Comment not sent. Try again." after `onComment` rejects, unless you fill its slot. */
export const FeedbackCommentError = withDefault(
  parts.CommentError,
  "FeedbackCommentError",
  () => "Comment not sent. Try again.",
);

/** The comment box: a title, the text, Send and its error, unless you fill its slot. */
export const FeedbackContent = withDefault(parts.Content, "FeedbackContent", () => [
  h(FeedbackTitle),
  h(FeedbackCommentText),
  h("div", { "data-feedback-actions": "" }, [
    h(FeedbackCommentStatus),
    h(FeedbackCommentError),
    h(FeedbackCommentSend),
  ]),
]);

/**
 * Thumbs up and down for a response, then "Add a comment" while `onComment` is set, which opens a box to write one.
 * Anything in its default slot replaces the default parts.
 */
export const Feedback = withDefault(parts.Root, "Feedback", () => [
  h(FeedbackThumbs),
  h(FeedbackComment),
  h(FeedbackThanks),
  h(FeedbackContent),
]);
