"use client";

import { conversationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";

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
  "error-text": "div",
  retry: "button",
});

/** Pass `controller={createConversationController()}` (from `@kind-ui/agent-ui/core`) to scroll it from outside. */
export const Conversation = conversation.Root;
export const ConversationViewport = conversation.Viewport;
/**
 * With `virtualize`, render rows from its state, keyed by index so each measurement stays with its row:
 * `{({ rows }) => rows.map((row) => <ConversationRow key={row.index} value={row.key} index={row.index} …/>)}`.
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
export function ConversationSkeleton({ children = SKELETON_ROWS, ...props }: ConversationSkeletonProps) {
  return <conversation.Skeleton {...props}>{children}</conversation.Skeleton>;
}

export type ConversationLoadingProps = ComponentProps<typeof conversation.Loading>;

/** The visually hidden status read while `status` is `"loading"`: "Loading conversation", unless you pass children. */
export function ConversationLoading({
  children = "Loading conversation",
  ...props
}: ConversationLoadingProps) {
  return <conversation.Loading {...props}>{children}</conversation.Loading>;
}

export type ConversationErrorProps = ComponentProps<typeof conversation.Error>;

/** Shown while `status` is `"error"`: its words and Retry, unless you pass children. */
export function ConversationError({ children = ERROR_PARTS, ...props }: ConversationErrorProps) {
  return <conversation.Error {...props}>{children}</conversation.Error>;
}

export type ConversationErrorTextProps = ComponentProps<typeof conversation.ErrorText>;

/** The `error` option's words, unless you pass children. */
export function ConversationErrorText({
  children = ({ error }) => error,
  ...props
}: ConversationErrorTextProps) {
  return <conversation.ErrorText {...props}>{children}</conversation.ErrorText>;
}

export type ConversationRetryProps = ComponentProps<typeof conversation.Retry>;

/** Calls `onRetry`, shown only while it's set. "Retry", unless you pass children. */
export function ConversationRetry({ children = "Retry", ...props }: ConversationRetryProps) {
  return <conversation.Retry {...props}>{children}</conversation.Retry>;
}

const SKELETON_ROWS = (
  <>
    <span />
    <span />
    <span />
  </>
);

const ERROR_PARTS = (
  <>
    <ConversationErrorText />
    <ConversationRetry />
  </>
);
