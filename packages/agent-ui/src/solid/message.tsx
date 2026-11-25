import {
  type MessageOptions,
  type MessageRegenerateContentState,
  messagePrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/solid/avatar";
import { MenuTrigger } from "@ui-sdk/solid/menu";
import { createParts } from "@ui-sdk/solid/primitive";
import { createMemo, For, omit, Show } from "solid-js";
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
  delivery: "span",
  "delivery-icon": "span",
  "delivery-text": "span",
  withdraw: "button",
  retrying: "div",
  "retrying-icon": "span",
});

/** A regenerate option, whose `icon` is an image URL or an element such as an inline `svg`. */
export type MessageRegenerateOption = Omit<
  NonNullable<MessageOptions["regenerateOptions"]>[number],
  "icon" | "items"
> & {
  icon?: string | JSX.Element;
  items?: MessageRegenerateOption[];
};

export type MessageProps = Omit<ComponentProps<typeof message.Root>, "regenerateOptions"> & {
  regenerateOptions?: MessageRegenerateOption[];
};

/** Name it with `aria-label`, like "Assistant message". */
export function Message(props: MessageProps) {
  return <message.Root {...(props as ComponentProps<typeof message.Root>)} />;
}

export type MessageAvatarProps = ComponentProps<typeof message.Avatar>;

type AvatarState = { name: string; initials: string; src: string | undefined };

const defaultAvatar = (state: AvatarState) => (
  <Show when={state.name}>
    <Avatar>
      <Show when={state.src}>{(src) => <AvatarImage src={src()} alt="" />}</Show>
      <AvatarFallback>{state.initials}</AvatarFallback>
    </Avatar>
  </Show>
);

/** With an `author`, a UI SDK Avatar of their image, showing their initials until it loads, unless you pass children. */
export function MessageAvatar(props: MessageAvatarProps) {
  return <message.Avatar {...omit(props, "children")}>{props.children ?? defaultAvatar}</message.Avatar>;
}

/** Holds the author, time and duration, while any of them shows. */
export const MessageHeader = message.Header;

/** The `author`'s name, unless the message is `continued`. */
export function MessageAuthor(props: Omit<ComponentProps<typeof message.Author>, "children">) {
  return <message.Author {...props}>{(state) => state.name}</message.Author>;
}

/** A `<time>` of `createdAt`: the time of day, with the date when it isn't today. */
export function MessageTime(props: Omit<ComponentProps<typeof message.Time>, "children">) {
  return <message.Time {...props}>{(state) => state.label}</message.Time>;
}

/** How long the response took, like "1 min 12 sec". */
export function MessageDuration(props: Omit<ComponentProps<typeof message.Duration>, "children">) {
  return <message.Duration {...props}>{(state) => state.label}</message.Duration>;
}

export const MessageDeliveryIcon = message.DeliveryIcon;

/** "Steered" or "Queued". */
export function MessageDeliveryText(props: Omit<ComponentProps<typeof message.DeliveryText>, "children">) {
  return <message.DeliveryText {...props}>{(state) => state.text}</message.DeliveryText>;
}

/** Shown while `onWithdraw` is set and the message is queued. */
export function MessageWithdraw(props: ComponentProps<typeof message.Withdraw>) {
  return <message.Withdraw {...omit(props, "children")}>{props.children ?? "Withdraw"}</message.Withdraw>;
}

/** Put it in the header. With `delivery`, its mark and words, then Withdraw while queued, unless you pass children. */
export function MessageDelivery(props: ComponentProps<typeof message.Delivery>) {
  return (
    <message.Delivery {...omit(props, "children")}>
      {props.children ?? (
        <>
          <MessageDeliveryIcon />
          <MessageDeliveryText />
          <MessageWithdraw />
        </>
      )}
    </message.Delivery>
  );
}

export const MessageRetryingIcon = message.RetryingIcon;

/**
 * Put it after the content, where the outcome goes. While `retry` is set: a running mark and "Retrying, attempt 2 of
 * 5, in 4 sec".
 */
export function MessageRetrying(props: Omit<ComponentProps<typeof message.Retrying>, "children">) {
  return (
    <message.Retrying {...props}>
      {(state) => (
        <>
          <MessageRetryingIcon />
          {state.text}
        </>
      )}
    </message.Retrying>
  );
}

export const MessageOutcomeIcon = message.OutcomeIcon;

/** "Stopped", or the `error` option's words. */
export function MessageOutcomeText(props: Omit<ComponentProps<typeof message.OutcomeText>, "children">) {
  return <message.OutcomeText {...props}>{(state) => state.text}</message.OutcomeText>;
}

/** Shown while `onRetry` is set and the message failed. */
export function MessageRetry(props: ComponentProps<typeof message.Retry>) {
  return <message.Retry {...omit(props, "children")}>{props.children ?? "Retry"}</message.Retry>;
}

/** Shown while `onContinue` is set and the message stopped. */
export function MessageContinue(props: ComponentProps<typeof message.Continue>) {
  return <message.Continue {...omit(props, "children")}>{props.children ?? "Continue"}</message.Continue>;
}

/**
 * Shown after the content once the response stopped or failed: its mark, its words, then Retry or Continue, unless
 * you pass children.
 */
export function MessageOutcome(props: ComponentProps<typeof message.Outcome>) {
  return (
    <message.Outcome {...omit(props, "children")}>
      {props.children ?? (
        <>
          <MessageOutcomeIcon />
          <MessageOutcomeText />
          <MessageRetry />
          <MessageContinue />
        </>
      )}
    </message.Outcome>
  );
}

export const MessageContent = message.Content;
export type MessageEditorProps = Omit<ComponentProps<typeof message.Editor>, "children"> & {
  /** What follows the text area: `<MessageEditActions />` by default. Pass your own, or `null` for none. */
  children?: JSX.Element;
};

/** Shown in place of the content while a user message is edited, with Cancel and Save after it unless you pass children. */
export function MessageEditor(props: MessageEditorProps) {
  const child = createMemo(() => props.children);
  return (
    <>
      <message.Editor {...omit(props, "children")} />
      {child() === undefined ? <MessageEditActions /> : child()}
    </>
  );
}

/** Cancel and Save, shown while the message is edited. Enter and Escape do the same. */
export function MessageEditActions(props: ComponentProps<typeof message.EditActions>) {
  return (
    <message.EditActions {...omit(props, "children")}>
      {props.children ?? (
        <>
          <MessageEditCancel />
          <MessageEditSave />
        </>
      )}
    </message.EditActions>
  );
}

/** Ends the edit without saving, as Escape does. "Cancel", unless you pass children. */
export function MessageEditCancel(props: ComponentProps<typeof message.EditCancel>) {
  return <message.EditCancel {...omit(props, "children")}>{props.children ?? "Cancel"}</message.EditCancel>;
}

/** Saves the edit, as Enter does. "Save", unless you pass children. */
export function MessageEditSave(props: ComponentProps<typeof message.EditSave>) {
  return <message.EditSave {...omit(props, "children")}>{props.children ?? "Save"}</message.EditSave>;
}

/** Shown once the message settles. Holds the branch switcher and a `KindToolbar` of actions. */
export const MessageToolbar = message.Toolbar;
/** Wrap a `KindToolbarButton` in each action: `<MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>`. */
export const MessageCopy = message.Copy;

/** Renders the toolbar button, given the props it needs to open the regenerate menu (none without a menu). */
export type MessageRegenerateButton = (props: Record<string, unknown>) => JSX.Element;

export type MessageRegenerateProps = Omit<ComponentProps<typeof message.Regenerate>, "children"> & {
  /**
   * The `KindToolbarButton` that regenerates, or opens the menu while there are `regenerateOptions`. Pass it as a
   * function of the props it spreads, `{(props) => <KindToolbarButton aria-label="Regenerate" {...props} />}`, so it
   * can be the menu's trigger; an element only regenerates.
   */
  children?: JSX.Element | MessageRegenerateButton;
  /** The menu, while there are `regenerateOptions`: `<MessageRegenerateContent />` by default. */
  menuContent?: JSX.Element;
};

/**
 * Wraps the toolbar button that regenerates. While the message has `regenerateOptions`, the button opens a menu of
 * them instead, rendered through UI SDK's `MenuTrigger`, so it keeps its place in the toolbar's arrow-key order.
 */
export function MessageRegenerate(props: MessageRegenerateProps) {
  // Read once: each read of an element child builds it again.
  const child = createMemo(() => props.children);
  const button = () => {
    const value = child();
    return typeof value === "function" ? (value as MessageRegenerateButton) : undefined;
  };
  const plain = () => {
    const render = button();
    return render ? render({}) : (child() as JSX.Element);
  };
  return (
    <message.Regenerate {...omit(props, "children", "menuContent")}>
      {(state) => (
        <Show when={button() && state.menu} fallback={plain()}>
          <KindMenu {...state.menu}>
            <message.RegenerateTrigger>
              <MenuTrigger render={(trigger: Record<string, unknown>) => button()?.(trigger)} />
            </message.RegenerateTrigger>
            {props.menuContent ?? <MessageRegenerateContent />}
          </KindMenu>
        </Show>
      )}
    </message.Regenerate>
  );
}

function Rows(props: { options: MessageRegenerateContentState["options"] }) {
  return (
    <For each={props.options} keyed={(option) => option.id}>
      {(option) => (
        <Show
          when={option().items}
          fallback={
            <KindMenuItem value={option().id} label={option().label}>
              <KindMenuItemContent
                icon={option().icon}
                label={option().label}
                description={option().description}
              />
            </KindMenuItem>
          }
        >
          {(items) => (
            <KindMenuSub>
              <KindMenuSubTrigger>
                <KindMenuItemContent
                  icon={option().icon}
                  label={option().label}
                  description={option().description}
                />
                <span data-menu-chevron="" />
              </KindMenuSubTrigger>
              <KindMenuSubContent>
                <Rows options={items()} />
              </KindMenuSubContent>
            </KindMenuSub>
          )}
        </Show>
      )}
    </For>
  );
}

export type MessageRegenerateRowsProps = MessageRegenerateContentState;

/** The regenerate menu's rows: "Try again", a separator, then the options, a submenu for each with `items`. */
export function MessageRegenerateRows(props: MessageRegenerateRowsProps) {
  return (
    <>
      <Rows options={[props.tryAgain]} />
      <KindMenuSeparator />
      <Rows options={props.options} />
    </>
  );
}

export type MessageRegenerateContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** What the menu holds, or a function of its rows: the rows by default. */
  children?: JSX.Element | ((state: MessageRegenerateContentState) => JSX.Element);
};

/** The regenerate menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. */
export function MessageRegenerateContent(props: MessageRegenerateContentProps) {
  const child = createMemo(() => props.children);
  return (
    <message.RegenerateContent>
      {(state) => (
        // Hidden from agents, which use the Message's own `regenerate`. Kept in the page while closed, as on web, so
        // the mark keeps Menu out of the snapshot while only its trigger would show.
        <KindMenuContent
          align="start"
          sideOffset={6}
          keepMounted
          data-agent-hidden=""
          {...omit(props, "children")}
        >
          {(() => {
            const value = child();
            return typeof value === "function"
              ? value(state)
              : (value ?? <MessageRegenerateRows tryAgain={state.tryAgain} options={state.options} />);
          })()}
        </KindMenuContent>
      )}
    </message.RegenerateContent>
  );
}

export const MessageEdit = message.Edit;
export const MessageBranch = message.Branch;
export const MessageBranchPrevious = message.BranchPrevious;
/** Shows the branch, like "2 of 3". */
export function MessageBranchLabel(props: Omit<ComponentProps<typeof message.BranchLabel>, "children">) {
  return <message.BranchLabel {...props}>{(state) => state.label}</message.BranchLabel>;
}
export const MessageBranchNext = message.BranchNext;
