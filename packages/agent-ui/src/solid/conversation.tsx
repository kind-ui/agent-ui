import { conversationPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

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

/** Pass `controller={createConversationController()}` (from `@kind-ui/agent-ui/core`) to scroll it from outside. */
export const Conversation = conversation.Root;
export const ConversationViewport = conversation.Viewport;
/**
 * With `virtualize`, render rows from its state, keyed by index so each measurement stays with its row:
 * `{(state) => <For each={state.rows} keyed={(row) => row.index}>{(row) => <ConversationRow value={row().key} index={row().index}>…</ConversationRow>}</For>}`.
 */
export const ConversationContent = conversation.Content;
export const ConversationRow = conversation.Row;
/** Its text is the new-message count, written by the primitive; render it without children. */
export const ConversationJump = conversation.Jump;
export const ConversationEmpty = conversation.Empty;
export const ConversationEmptyTitle = conversation.EmptyTitle;
export const ConversationEmptyDescription = conversation.EmptyDescription;

export type ConversationSkeletonProps = ComponentProps<typeof conversation.Skeleton>;

/** Three placeholder rows while `status` is `"loading"`, unless you pass children. Hidden from assistive technology. */
export function ConversationSkeleton(props: ConversationSkeletonProps) {
  return (
    <conversation.Skeleton {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span />
          <span />
          <span />
        </>
      )}
    </conversation.Skeleton>
  );
}

export type ConversationLoadingProps = ComponentProps<typeof conversation.Loading>;

/** The visually hidden status read while `status` is `"loading"`: "Loading conversation", unless you pass children. */
export function ConversationLoading(props: ConversationLoadingProps) {
  return (
    <conversation.Loading {...omit(props, "children")}>
      {props.children ?? "Loading conversation"}
    </conversation.Loading>
  );
}

export type ConversationErrorProps = ComponentProps<typeof conversation.Error>;

/** Shown while `status` is `"error"`: its mark, its words and Retry, unless you pass children. */
export function ConversationError(props: ConversationErrorProps) {
  return (
    <conversation.Error {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ConversationErrorIcon />
          <ConversationErrorText />
          <ConversationRetry />
        </>
      )}
    </conversation.Error>
  );
}

/** The error's status mark. Hidden from assistive technology: the words say it. */
export const ConversationErrorIcon = conversation.ErrorIcon;

export type ConversationErrorTextProps = ComponentProps<typeof conversation.ErrorText>;

/** The `error` option's words, unless you pass children. */
export function ConversationErrorText(props: ConversationErrorTextProps) {
  return (
    <conversation.ErrorText {...omit(props, "children")}>
      {props.children ?? ((state) => state.error)}
    </conversation.ErrorText>
  );
}

export type ConversationRetryProps = ComponentProps<typeof conversation.Retry>;

/** Calls `onRetry`, shown only while it's set. "Retry", unless you pass children. */
export function ConversationRetry(props: ConversationRetryProps) {
  return <conversation.Retry {...omit(props, "children")}>{props.children ?? "Retry"}</conversation.Retry>;
}

export type ConversationMarksProps = ComponentProps<typeof conversation.Marks>;

/**
 * The track beside the scrollbar that shows each message in `marks`, one `ConversationMark` per 4px step that holds
 * one, unless you pass children. Hidden from assistive technology.
 */
export function ConversationMarks(props: ConversationMarksProps) {
  return (
    <conversation.Marks {...omit(props, "children")}>
      {props.children ??
        ((state) => <For each={state.marks}>{(step) => <ConversationMark value={String(step)} />}</For>)}
    </conversation.Marks>
  );
}

/** One mark on the track, at `--kind-conversation-mark` (0 to 1) down it. `value` is its step. */
export const ConversationMark = conversation.Mark;
