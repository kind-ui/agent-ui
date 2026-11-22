import type { ComponentProps } from "svelte";
import ConversationError from "./ConversationError.svelte";
import ConversationErrorText from "./ConversationErrorText.svelte";
import ConversationLoading from "./ConversationLoading.svelte";
import ConversationMarks from "./ConversationMarks.svelte";
import ConversationRetry from "./ConversationRetry.svelte";
import ConversationSkeleton from "./ConversationSkeleton.svelte";
import { parts } from "./parts.js";

/** Pass `controller={createConversationController()}` (from `@kind-ui/agent-ui/core`) to scroll it from outside. */
export const Conversation = parts.Root;
export const ConversationViewport = parts.Viewport;
/**
 * With `virtualize`, render rows from its state, keyed by index so each measurement stays with its row:
 * `{#snippet children({ rows })}{#each rows as row (row.index)}<ConversationRow value={…} index={row.index}>…{/each}{/snippet}`.
 */
export const ConversationContent = parts.Content;
export const ConversationRow = parts.Row;
/** Its text is the new-message count, written by the primitive; render it without children. */
export const ConversationJump = parts.Jump;
export const ConversationEmpty = parts.Empty;
export const ConversationEmptyTitle = parts.EmptyTitle;
export const ConversationEmptyDescription = parts.EmptyDescription;
/** The error's status mark. Hidden from assistive technology: the words say it. */
export const ConversationErrorIcon = parts.ErrorIcon;
/** One mark on the track, at `--kind-conversation-mark` (0 to 1) down it. `value` is its step. */
export const ConversationMark = parts.Mark;

export {
  ConversationError,
  ConversationErrorText,
  ConversationLoading,
  ConversationMarks,
  ConversationRetry,
  ConversationSkeleton,
};
export type ConversationSkeletonProps = ComponentProps<typeof ConversationSkeleton>;
export type ConversationLoadingProps = ComponentProps<typeof ConversationLoading>;
export type ConversationErrorProps = ComponentProps<typeof ConversationError>;
export type ConversationErrorTextProps = ComponentProps<typeof ConversationErrorText>;
export type ConversationRetryProps = ComponentProps<typeof ConversationRetry>;
export type ConversationMarksProps = ComponentProps<typeof ConversationMarks>;
