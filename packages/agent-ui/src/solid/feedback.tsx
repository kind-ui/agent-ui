import { feedbackPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { Toggle, ToggleGroup, ToggleIcon } from "@ui-sdk/solid/toggle";
import { omit } from "solid-js";
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

export type FeedbackProps = ComponentProps<typeof parts.Root>;

/**
 * Thumbs up and down for a response, then "Add a comment" while `onComment` is set, which opens a box to write one.
 * Any `children` replace the default parts.
 */
export function Feedback(props: FeedbackProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <FeedbackThumbs />
          <FeedbackComment />
          <FeedbackThanks />
          <FeedbackContent />
        </>
      )}
    </parts.Root>
  );
}

export type FeedbackThumbsProps = Omit<ComponentProps<typeof parts.Thumbs>, "children"> & {
  children?: JSX.Element;
};

/** UI SDK's Toggle group, holding the thumbs unless you pass children. One Tab stop, with arrow keys between. */
export function FeedbackThumbs(props: FeedbackThumbsProps) {
  return (
    <parts.Thumbs {...omit(props, "children")}>
      {(group) => (
        // Hidden from agents, which use the Feedback's own `rate`.
        <ToggleGroup
          controller={group.controller}
          defaultValue={group.defaultValue}
          aria-label={group["aria-label"]}
          data-agent-hidden=""
        >
          {props.children ?? (
            <>
              <FeedbackUp />
              <FeedbackDown />
            </>
          )}
        </ToggleGroup>
      )}
    </parts.Thumbs>
  );
}

export type FeedbackThumbProps = Omit<ComponentProps<typeof Toggle>, "value">;

/** "Good response": a Toggle whose value is `"up"`. */
export function FeedbackUp(props: FeedbackThumbProps) {
  return (
    <Toggle
      value="up"
      aria-label="Good response"
      data-kind-icon-button=""
      data-kind-size="sm"
      {...omit(props, "children")}
    >
      {props.children ?? <ToggleIcon data-feedback-icon="up" />}
    </Toggle>
  );
}

/** "Bad response": a Toggle whose value is `"down"`. */
export function FeedbackDown(props: FeedbackThumbProps) {
  return (
    <Toggle
      value="down"
      aria-label="Bad response"
      data-kind-icon-button=""
      data-kind-size="sm"
      {...omit(props, "children")}
    >
      {props.children ?? <ToggleIcon data-feedback-icon="down" />}
    </Toggle>
  );
}

export type FeedbackCommentProps = ComponentProps<typeof parts.Comment>;

/** "Add a comment", unless you pass children. Opens the comment box. Rendered once there's a rating and `onComment`. */
export function FeedbackComment(props: FeedbackCommentProps) {
  return <parts.Comment {...omit(props, "children")}>{props.children ?? "Add a comment"}</parts.Comment>;
}

export type FeedbackThanksProps = ComponentProps<typeof parts.Thanks>;

/** "Thanks for your feedback", unless you pass children. Rendered while `commentSent` is set. */
export function FeedbackThanks(props: FeedbackThanksProps) {
  return (
    <parts.Thanks {...omit(props, "children")}>{props.children ?? "Thanks for your feedback"}</parts.Thanks>
  );
}

export type FeedbackContentProps = ComponentProps<typeof parts.Content>;

/** The comment box: a title, the text, Send and its error, unless you pass children. */
export function FeedbackContent(props: FeedbackContentProps) {
  return (
    <parts.Content {...omit(props, "children")}>
      {props.children ?? (
        <>
          <FeedbackTitle />
          <FeedbackCommentText />
          <div data-feedback-actions="">
            <FeedbackCommentStatus />
            <FeedbackCommentError />
            <FeedbackCommentSend />
          </div>
        </>
      )}
    </parts.Content>
  );
}

export type FeedbackTitleProps = ComponentProps<typeof parts.Title>;

/** "Add a comment", unless you pass children. Names the comment box; the styles keep it for assistive technology only. */
export function FeedbackTitle(props: FeedbackTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? "Add a comment"}</parts.Title>;
}

export type FeedbackCommentTextProps = ComponentProps<typeof parts.CommentText>;

/** UI SDK's Textarea, unless you pass children, a function that gets its props, its placeholder keyed on the rating. */
export function FeedbackCommentText(props: FeedbackCommentTextProps) {
  return (
    <parts.CommentText {...omit(props, "children")}>
      {props.children ??
        ((textarea) => (
          <KindTextarea
            controller={textarea.controller}
            defaultValue={textarea.defaultValue}
            readonly={textarea.readOnly}
            placeholder={textarea.placeholder}
            aria-label={textarea["aria-label"]}
            rows={3}
          />
        ))}
    </parts.CommentText>
  );
}

export type FeedbackCommentSendProps = ComponentProps<typeof parts.CommentSend>;

/** Sends the comment through `onComment`. Reads "Send" unless you pass children. */
export function FeedbackCommentSend(props: FeedbackCommentSendProps) {
  return <parts.CommentSend {...omit(props, "children")}>{props.children ?? "Send"}</parts.CommentSend>;
}

export const FeedbackCommentStatusIcon = parts.CommentStatusIcon;

export type FeedbackCommentStatusProps = ComponentProps<typeof parts.CommentStatus>;

/** A running mark and "Sending" while `onComment` is pending, unless you pass children. */
export function FeedbackCommentStatus(props: FeedbackCommentStatusProps) {
  return (
    <parts.CommentStatus {...omit(props, "children")}>
      {props.children ?? (
        <>
          <FeedbackCommentStatusIcon />
          Sending
        </>
      )}
    </parts.CommentStatus>
  );
}

export type FeedbackCommentErrorProps = ComponentProps<typeof parts.CommentError>;

/** "Comment not sent. Try again." after `onComment` rejects, unless you pass children. */
export function FeedbackCommentError(props: FeedbackCommentErrorProps) {
  return (
    <parts.CommentError {...omit(props, "children")}>
      {props.children ?? "Comment not sent. Try again."}
    </parts.CommentError>
  );
}
