"use client";

import {
  type MessageOptions,
  type MessageRegenerateContentState,
  messagePrimitive,
} from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/react/avatar";
import { MenuTrigger } from "@ui-sdk/react/menu";
import { createParts } from "@ui-sdk/react/primitive";
import { type ComponentProps, isValidElement, type ReactElement, type ReactNode } from "react";
import {
  KindMenu,
  KindMenuContent,
  KindMenuItem,
  KindMenuItemContent,
  KindMenuSeparator,
  KindMenuSub,
  KindMenuSubContent,
  KindMenuSubTrigger,
} from "./internal/menu.js";

const message = createParts(messagePrimitive, {
  root: "div",
  avatar: "div",
  content: "div",
  editor: "textarea",
  "edit-actions": "div",
  "edit-cancel": "button",
  "edit-save": "button",
  toolbar: "div",
  copy: "span",
  regenerate: "span",
  "regenerate-trigger": "span",
  "regenerate-content": "span",
  edit: "span",
  branch: "div",
  "branch-previous": "button",
  "branch-label": "span",
  "branch-next": "button",
  header: "div",
  author: "span",
  time: "time",
  duration: "span",
  outcome: "div",
  "outcome-icon": "span",
  "outcome-text": "span",
  retry: "button",
  continue: "button",
  delivery: "div",
  "delivery-text": "span",
  withdraw: "button",
  resend: "button",
  retrying: "div",
  "retrying-icon": "span",
  "retrying-reason": "span",
  "retrying-text": "span",
  "retry-now": "button",
  "cancel-retry": "button",
});

/** A regenerate option, whose `icon` is an image URL or an element such as an inline `svg`. */
export type MessageRegenerateOption = Omit<
  NonNullable<MessageOptions["regenerateOptions"]>[number],
  "icon" | "items"
> & {
  icon?: string | ReactElement;
  items?: MessageRegenerateOption[];
};

export type MessageProps = Omit<ComponentProps<typeof message.Root>, "regenerateOptions"> & {
  regenerateOptions?: MessageRegenerateOption[];
};

/** Name it with `aria-label`, like "Assistant message". */
export function Message(props: MessageProps) {
  return <message.Root {...props} />;
}

export type MessageAvatarProps = ComponentProps<typeof message.Avatar>;

/** With an `author`, a UI SDK Avatar of their image, showing their initials until it loads, unless you pass children. */
export function MessageAvatar({
  children = ({ name, initials, src }) =>
    name ? (
      <Avatar>
        {src ? <AvatarImage src={src} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    ) : null,
  ...props
}: MessageAvatarProps) {
  return <message.Avatar {...props}>{children}</message.Avatar>;
}

/** Holds the author, time and duration, while any of them shows. */
export const MessageHeader = message.Header;

/** The `author`'s name, unless the message is `continued`. */
export function MessageAuthor(props: Omit<ComponentProps<typeof message.Author>, "children">) {
  return <message.Author {...props}>{({ name }) => name}</message.Author>;
}

/** A `<time>` of `createdAt`: the time of day, with the date when it isn't today. */
export function MessageTime(props: Omit<ComponentProps<typeof message.Time>, "children">) {
  return <message.Time {...props}>{({ label }) => label}</message.Time>;
}

/** How long the response took, like "1 min 12 sec". */
export function MessageDuration(props: Omit<ComponentProps<typeof message.Duration>, "children">) {
  return <message.Duration {...props}>{({ label }) => label}</message.Duration>;
}

export const MessageOutcomeIcon = message.OutcomeIcon;

/** "Stopped", "Failed after 5 attempts" while `retry` is still set, or the `error` option's words. */
export function MessageOutcomeText(props: Omit<ComponentProps<typeof message.OutcomeText>, "children">) {
  return <message.OutcomeText {...props}>{({ text }) => text}</message.OutcomeText>;
}

/** Shown while `onRetry` is set and the message failed. */
export function MessageRetry({ children = "Retry", ...props }: ComponentProps<typeof message.Retry>) {
  return <message.Retry {...props}>{children}</message.Retry>;
}

/** Shown while `onContinue` is set and the message stopped. */
export function MessageContinue({
  children = "Continue",
  ...props
}: ComponentProps<typeof message.Continue>) {
  return <message.Continue {...props}>{children}</message.Continue>;
}

const OUTCOME = (
  <>
    <MessageOutcomeIcon />
    <MessageOutcomeText />
    <MessageRetry />
    <MessageContinue />
  </>
);

/**
 * Shown after the content once the response stopped or failed: its mark, its words, then Retry or Continue, unless
 * you pass children.
 */
export function MessageOutcome({ children = OUTCOME, ...props }: ComponentProps<typeof message.Outcome>) {
  return <message.Outcome {...props}>{children}</message.Outcome>;
}

/** "Steering…", "Queued, not sent" or "Not sent": the message's accessible description while it isn't delivered. */
export function MessageDeliveryText(props: Omit<ComponentProps<typeof message.DeliveryText>, "children">) {
  return <message.DeliveryText {...props}>{({ text }) => text}</message.DeliveryText>;
}

/** Shown while `onWithdraw` is set and the message is queued or steering. "Withdraw", unless you pass children. */
export function MessageWithdraw({
  children = ({ label }) => label,
  ...props
}: ComponentProps<typeof message.Withdraw>) {
  return <message.Withdraw {...props}>{children}</message.Withdraw>;
}

/** Shown while `onResend` is set and the message wasn't sent. "Retry", unless you pass children. */
export function MessageResend({
  children = ({ label }) => label,
  ...props
}: ComponentProps<typeof message.Resend>) {
  return <message.Resend {...props}>{children}</message.Resend>;
}

const DELIVERY = (
  <>
    <MessageDeliveryText />
    <MessageWithdraw />
    <MessageResend />
  </>
);

/** Under a user message that isn't delivered yet: its words, then Withdraw or Retry, unless you pass children. */
export function MessageDelivery({ children = DELIVERY, ...props }: ComponentProps<typeof message.Delivery>) {
  return <message.Delivery {...props}>{children}</message.Delivery>;
}

export const MessageRetryingIcon = message.RetryingIcon;

/** The retry's `reason`, as a sentence: "Rate limited.". */
export function MessageRetryingReason(
  props: Omit<ComponentProps<typeof message.RetryingReason>, "children">,
) {
  return <message.RetryingReason {...props}>{({ reason }) => reason}</message.RetryingReason>;
}

/** "Retrying in 4 sec, attempt 2 of 5", counting down. */
export function MessageRetryingText(props: Omit<ComponentProps<typeof message.RetryingText>, "children">) {
  return <message.RetryingText {...props}>{({ text }) => text}</message.RetryingText>;
}

/** Shown while `onRetryNow` is set. "Retry now", unless you pass children. */
export function MessageRetryNow({
  children = ({ label }) => label,
  ...props
}: ComponentProps<typeof message.RetryNow>) {
  return <message.RetryNow {...props}>{children}</message.RetryNow>;
}

/** Shown while `onCancelRetry` is set. "Cancel", unless you pass children. */
export function MessageCancelRetry({
  children = ({ label }) => label,
  ...props
}: ComponentProps<typeof message.CancelRetry>) {
  return <message.CancelRetry {...props}>{children}</message.CancelRetry>;
}

const RETRYING = (
  <>
    <MessageRetryingIcon />
    <span>
      <MessageRetryingReason /> <MessageRetryingText />
    </span>
    <MessageRetryNow />
    <MessageCancelRetry />
  </>
);

/**
 * Shown after the content while `retry` is set and the request hasn't failed: a running mark, the reason, the
 * countdown and attempt, then Retry now and Cancel, unless you pass children.
 */
export function MessageRetrying({ children = RETRYING, ...props }: ComponentProps<typeof message.Retrying>) {
  return <message.Retrying {...props}>{children}</message.Retrying>;
}

export const MessageContent = message.Content;
export type MessageEditorProps = Omit<ComponentProps<typeof message.Editor>, "children"> & {
  /** What follows the text area: `<MessageEditActions />` by default. Pass your own, or `null` for none. */
  children?: ReactNode;
};

/** Shown in place of the content while a user message is edited, with Cancel and Save after it unless you pass children. */
export function MessageEditor({ children = DEFAULT_EDIT_ACTIONS, ...props }: MessageEditorProps) {
  return (
    <>
      <message.Editor {...props} />
      {children}
    </>
  );
}

/** Cancel and Save, shown while the message is edited. Enter and Escape do the same. */
export function MessageEditActions({
  children = EDIT_ACTIONS,
  ...props
}: ComponentProps<typeof message.EditActions>) {
  return <message.EditActions {...props}>{children}</message.EditActions>;
}

/** Ends the edit without saving, as Escape does. "Cancel", unless you pass children. */
export function MessageEditCancel({
  children = "Cancel",
  ...props
}: ComponentProps<typeof message.EditCancel>) {
  return <message.EditCancel {...props}>{children}</message.EditCancel>;
}

/** Saves the edit, as Enter does. "Save", unless you pass children. */
export function MessageEditSave({ children = "Save", ...props }: ComponentProps<typeof message.EditSave>) {
  return <message.EditSave {...props}>{children}</message.EditSave>;
}

const EDIT_ACTIONS = (
  <>
    <MessageEditCancel />
    <MessageEditSave />
  </>
);
const DEFAULT_EDIT_ACTIONS = <MessageEditActions />;
/** Shown once the message settles. Holds the branch switcher and a `KindToolbar` of actions. */
export const MessageToolbar = message.Toolbar;
/** Wrap a `KindToolbarButton` in each action: `<MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>`. */
export const MessageCopy = message.Copy;

export type MessageRegenerateProps = Omit<ComponentProps<typeof message.Regenerate>, "children"> & {
  /** The `KindToolbarButton` that regenerates, or opens the menu while there are `regenerateOptions`. */
  children?: ReactNode;
  /** The menu, while there are `regenerateOptions`: `<MessageRegenerateContent />` by default. */
  menuContent?: ReactNode;
};

/**
 * Wraps the toolbar button that regenerates. While the message has `regenerateOptions`, the button opens a menu of
 * them instead, rendered through UI SDK's `MenuTrigger`, so it keeps its place in the toolbar's arrow-key order.
 */
export function MessageRegenerate({
  children,
  menuContent = DEFAULT_CONTENT,
  ...props
}: MessageRegenerateProps) {
  return (
    <message.Regenerate {...props}>
      {({ menu }) =>
        menu && isValidElement<Record<string, unknown>>(children) ? (
          <KindMenu {...menu}>
            <message.RegenerateTrigger>
              <MenuTrigger render={children} />
            </message.RegenerateTrigger>
            {menuContent}
          </KindMenu>
        ) : (
          children
        )
      }
    </message.Regenerate>
  );
}

function Rows({ options }: { options: MessageRegenerateContentState["options"] }) {
  return options.map((option) =>
    option.items ? (
      <KindMenuSub key={option.id}>
        <KindMenuSubTrigger>
          <KindMenuItemContent icon={option.icon} label={option.label} description={option.description} />
          <span data-menu-chevron="" />
        </KindMenuSubTrigger>
        <KindMenuSubContent>
          <Rows options={option.items} />
        </KindMenuSubContent>
      </KindMenuSub>
    ) : (
      <KindMenuItem key={option.id} value={option.id} label={option.label}>
        <KindMenuItemContent icon={option.icon} label={option.label} description={option.description} />
      </KindMenuItem>
    ),
  );
}

export type MessageRegenerateRowsProps = MessageRegenerateContentState;

/** The regenerate menu's rows: "Try again", a separator, then the options, a submenu for each with `items`. */
export function MessageRegenerateRows({ tryAgain, options }: MessageRegenerateRowsProps) {
  return (
    <>
      <Rows options={[tryAgain]} />
      <KindMenuSeparator />
      <Rows options={options} />
    </>
  );
}

export type MessageRegenerateContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** What the menu holds, or a function of its rows: the rows by default. */
  children?: ReactNode | ((state: MessageRegenerateContentState) => ReactNode);
};

/** The regenerate menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. */
export function MessageRegenerateContent({
  children = DEFAULT_ROWS,
  ...props
}: MessageRegenerateContentProps) {
  return (
    <message.RegenerateContent>
      {(state) => (
        // Hidden from agents, which use the Message's own `regenerate`. Kept in the page while closed, as on web, so
        // the mark keeps Menu out of the snapshot while only its trigger would show.
        <KindMenuContent align="start" sideOffset={6} keepMounted data-agent-hidden="" {...props}>
          {typeof children === "function" ? children(state) : children}
        </KindMenuContent>
      )}
    </message.RegenerateContent>
  );
}

const DEFAULT_ROWS = (state: MessageRegenerateContentState) => <MessageRegenerateRows {...state} />;
// Shared, so an update doesn't render the default content's wrapper again.
const DEFAULT_CONTENT = <MessageRegenerateContent />;

export const MessageEdit = message.Edit;
export const MessageBranch = message.Branch;
export const MessageBranchPrevious = message.BranchPrevious;
/** Shows the branch, like "2 of 3". */
export function MessageBranchLabel(props: Omit<ComponentProps<typeof message.BranchLabel>, "children">) {
  return <message.BranchLabel {...props}>{({ label }) => label}</message.BranchLabel>;
}
export const MessageBranchNext = message.BranchNext;
