import type { ComponentProps } from "svelte";
import Feedback from "./Feedback.svelte";
import FeedbackComment from "./FeedbackComment.svelte";
import FeedbackCommentError from "./FeedbackCommentError.svelte";
import FeedbackCommentSend from "./FeedbackCommentSend.svelte";
import FeedbackCommentStatus from "./FeedbackCommentStatus.svelte";
import FeedbackCommentText from "./FeedbackCommentText.svelte";
import FeedbackContent from "./FeedbackContent.svelte";
import FeedbackDown from "./FeedbackDown.svelte";
import FeedbackThanks from "./FeedbackThanks.svelte";
import FeedbackThumbs from "./FeedbackThumbs.svelte";
import FeedbackTitle from "./FeedbackTitle.svelte";
import FeedbackUp from "./FeedbackUp.svelte";
import { parts } from "./parts.js";

export const FeedbackCommentStatusIcon = parts.CommentStatusIcon;

export {
  Feedback,
  FeedbackComment,
  FeedbackCommentError,
  FeedbackCommentSend,
  FeedbackCommentStatus,
  FeedbackCommentText,
  FeedbackContent,
  FeedbackDown,
  FeedbackThanks,
  FeedbackThumbs,
  FeedbackTitle,
  FeedbackUp,
};

export type FeedbackProps = ComponentProps<typeof Feedback>;
export type FeedbackThumbsProps = ComponentProps<typeof FeedbackThumbs>;
export type FeedbackThumbProps = ComponentProps<typeof FeedbackUp>;
export type FeedbackCommentProps = ComponentProps<typeof FeedbackComment>;
export type FeedbackThanksProps = ComponentProps<typeof FeedbackThanks>;
export type FeedbackContentProps = ComponentProps<typeof FeedbackContent>;
export type FeedbackTitleProps = ComponentProps<typeof FeedbackTitle>;
export type FeedbackCommentTextProps = ComponentProps<typeof FeedbackCommentText>;
export type FeedbackCommentSendProps = ComponentProps<typeof FeedbackCommentSend>;
export type FeedbackCommentStatusProps = ComponentProps<typeof FeedbackCommentStatus>;
export type FeedbackCommentErrorProps = ComponentProps<typeof FeedbackCommentError>;
