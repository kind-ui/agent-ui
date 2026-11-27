import type { MessageOptions } from "@kind-ui/agent-ui/core";
import type { ComponentProps, Snippet } from "svelte";
import MessageAuthor from "./MessageAuthor.svelte";
import MessageAvatar from "./MessageAvatar.svelte";
import MessageBranchLabel from "./MessageBranchLabel.svelte";
import MessageCancelRetry from "./MessageCancelRetry.svelte";
import MessageContinue from "./MessageContinue.svelte";
import MessageDelivery from "./MessageDelivery.svelte";
import MessageDeliveryText from "./MessageDeliveryText.svelte";
import MessageDuration from "./MessageDuration.svelte";
import MessageEditActions from "./MessageEditActions.svelte";
import MessageEditCancel from "./MessageEditCancel.svelte";
import MessageEditor from "./MessageEditor.svelte";
import MessageEditSave from "./MessageEditSave.svelte";
import MessageOutcome from "./MessageOutcome.svelte";
import MessageOutcomeText from "./MessageOutcomeText.svelte";
import MessageRegenerate from "./MessageRegenerate.svelte";
import MessageRegenerateContent from "./MessageRegenerateContent.svelte";
import MessageRegenerateRows from "./MessageRegenerateRows.svelte";
import MessageResend from "./MessageResend.svelte";
import MessageRetry from "./MessageRetry.svelte";
import MessageRetrying from "./MessageRetrying.svelte";
import MessageRetryingReason from "./MessageRetryingReason.svelte";
import MessageRetryingText from "./MessageRetryingText.svelte";
import MessageRetryNow from "./MessageRetryNow.svelte";
import MessageTime from "./MessageTime.svelte";
import MessageWithdraw from "./MessageWithdraw.svelte";
import { parts } from "./parts.js";

/** A regenerate option, whose `icon` is an image URL or a snippet such as an inline `svg`. */
export type MessageRegenerateOption = Omit<
  NonNullable<MessageOptions["regenerateOptions"]>[number],
  "icon" | "items"
> & {
  icon?: string | Snippet;
  items?: MessageRegenerateOption[];
};

/** Name it with `aria-label`, like "Assistant message". */
export const Message = parts.Root;
type RootProps = ComponentProps<typeof parts.Root>;
// `Omit` would turn the known props into the index signature's `unknown`.
export type MessageProps = {
  [K in keyof RootProps as K extends "regenerateOptions" ? never : K]: RootProps[K];
} & {
  regenerateOptions?: MessageRegenerateOption[];
};

/** Holds the author, time and duration, while any of them shows. */
export const MessageHeader = parts.Header;
export const MessageOutcomeIcon = parts.OutcomeIcon;
export const MessageRetryingIcon = parts.RetryingIcon;
export const MessageContent = parts.Content;
/** Shown once the message settles. Holds the branch switcher and a `KindToolbar` of actions. */
export const MessageToolbar = parts.Toolbar;
/** Wrap a `KindToolbarButton` in each action: `<MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>`. */
export const MessageCopy = parts.Copy;
export const MessageEdit = parts.Edit;
export const MessageBranch = parts.Branch;
export const MessageBranchPrevious = parts.BranchPrevious;
export const MessageBranchNext = parts.BranchNext;

export {
  MessageAuthor,
  MessageAvatar,
  MessageBranchLabel,
  MessageCancelRetry,
  MessageContinue,
  MessageDelivery,
  MessageDeliveryText,
  MessageDuration,
  MessageEditActions,
  MessageEditCancel,
  MessageEditor,
  MessageEditSave,
  MessageOutcome,
  MessageOutcomeText,
  MessageRegenerate,
  MessageRegenerateContent,
  MessageRegenerateRows,
  MessageResend,
  MessageRetry,
  MessageRetrying,
  MessageRetryingReason,
  MessageRetryingText,
  MessageRetryNow,
  MessageTime,
  MessageWithdraw,
};
export type MessageAvatarProps = ComponentProps<typeof MessageAvatar>;
export type MessageEditorProps = ComponentProps<typeof MessageEditor>;
export type MessageRegenerateProps = ComponentProps<typeof MessageRegenerate>;
export type MessageRegenerateRowsProps = ComponentProps<typeof MessageRegenerateRows>;
export type MessageRegenerateContentProps = ComponentProps<typeof MessageRegenerateContent>;
