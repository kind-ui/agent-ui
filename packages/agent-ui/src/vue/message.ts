import {
  type MessageAvatarState,
  type MessageRegenerateContentState,
  type MessageRegenerateState,
  messagePrimitive,
} from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/vue/avatar";
import { MenuTrigger } from "@ui-sdk/vue/menu";
import { createParts } from "@ui-sdk/vue/primitive";
import {
  Comment,
  cloneVNode,
  defineComponent,
  Fragment,
  type FunctionalComponent,
  h,
  isVNode,
  type PropType,
  Text,
  type VNode,
} from "vue";
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

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onRegenerate` and `onEdit`, whose presence offers Regenerate and Edit, are declared function props instead, which
// `@regenerate` and `@edit` bind. `@branch-change` and `@copy` stay events.
const primitive = Object.defineProperty(
  Object.assign((options: never) => messagePrimitive(options), messagePrimitive, {
    options: { ...messagePrimitive.options, onRegenerate: "action", onEdit: "action" },
  }),
  "name",
  { value: messagePrimitive.name },
) as typeof messagePrimitive;

const message = createParts(primitive, {
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

/**
 * Name it with `aria-label`, like "Assistant message". A `regenerateOptions` row's `icon` is an image URL or a node
 * such as an inline `svg`. Regenerate and Edit are offered while `@regenerate` and `@edit` are bound.
 */
export const Message = message.Root;

/** With an `author`, a UI SDK Avatar of their image, showing their initials until it loads, unless you pass children. */
export const MessageAvatar = defineComponent({
  name: "MessageAvatar",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.Avatar, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: MessageAvatarState }) =>
            state.name
              ? h(Avatar, null, () => [
                  state.src ? h(AvatarImage, { src: state.src, alt: "" }) : null,
                  h(AvatarFallback, null, () => state.initials),
                ])
              : null),
      });
  },
});

/** Holds the author, time and duration, while any of them shows. */
export const MessageHeader = message.Header;

/** The `author`'s name, unless the message is `continued`. */
export const MessageAuthor = defineComponent({
  name: "MessageAuthor",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.Author, attrs, { ...slots, default: ({ state }: { state: { name: string } }) => state.name });
  },
});

/** A `<time>` of `createdAt`: the time of day, with the date when it isn't today. */
export const MessageTime = defineComponent({
  name: "MessageTime",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.Time, attrs, { ...slots, default: ({ state }: { state: { label: string } }) => state.label });
  },
});

/** How long the response took, like "1 min 12 sec". */
export const MessageDuration = defineComponent({
  name: "MessageDuration",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.Duration, attrs, {
        ...slots,
        default: ({ state }: { state: { label: string } }) => state.label,
      });
  },
});

export const MessageOutcomeIcon = message.OutcomeIcon;

/** "Stopped", "Failed after 5 attempts" while `retry` is still set, or the `error` option's words. */
export const MessageOutcomeText = defineComponent({
  name: "MessageOutcomeText",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.OutcomeText, attrs, {
        ...slots,
        default: ({ state }: { state: { text: string } }) => state.text,
      });
  },
});

/** Shown while `onRetry` is set and the message failed. */
export const MessageRetry = defineComponent({
  name: "MessageRetry",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.Retry, attrs, { ...slots, default: slots.default ?? (() => "Retry") });
  },
});

/** Shown while `onContinue` is set and the message stopped. */
export const MessageContinue = defineComponent({
  name: "MessageContinue",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.Continue, attrs, { ...slots, default: slots.default ?? (() => "Continue") });
  },
});

const outcome = () => [h(MessageOutcomeIcon), h(MessageOutcomeText), h(MessageRetry), h(MessageContinue)];

/**
 * Shown after the content once the response stopped or failed: its mark, its words, then Retry or Continue, unless
 * you pass children.
 */
export const MessageOutcome = defineComponent({
  name: "MessageOutcome",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.Outcome, attrs, { ...slots, default: slots.default ?? outcome });
  },
});

/** "Steering…", "Queued, not sent" or "Not sent": the message's accessible description while it isn't delivered. */
export const MessageDeliveryText = defineComponent({
  name: "MessageDeliveryText",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.DeliveryText, attrs, {
        ...slots,
        default: ({ state }: { state: { text: string } }) => state.text,
      });
  },
});

const labelled = ({ state }: { state: { label: string } }) => state.label;

/** Shown while `onWithdraw` is set and the message is queued or steering. "Withdraw", unless you pass children. */
export const MessageWithdraw = defineComponent({
  name: "MessageWithdraw",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.Withdraw, attrs, { ...slots, default: slots.default ?? labelled });
  },
});

/** Shown while `onResend` is set and the message wasn't sent. "Retry", unless you pass children. */
export const MessageResend = defineComponent({
  name: "MessageResend",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.Resend, attrs, { ...slots, default: slots.default ?? labelled });
  },
});

const delivery = () => [h(MessageDeliveryText), h(MessageWithdraw), h(MessageResend)];

/** Under a user message that isn't delivered yet: its words, then Withdraw or Retry, unless you pass children. */
export const MessageDelivery = defineComponent({
  name: "MessageDelivery",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.Delivery, attrs, { ...slots, default: slots.default ?? delivery });
  },
});

export const MessageRetryingIcon = message.RetryingIcon;

/** The retry's `reason`, as a sentence: "Rate limited.". */
export const MessageRetryingReason = defineComponent({
  name: "MessageRetryingReason",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.RetryingReason, attrs, {
        ...slots,
        default: ({ state }: { state: { reason: string } }) => state.reason,
      });
  },
});

/** "Retrying in 4 sec, attempt 2 of 5", counting down. */
export const MessageRetryingText = defineComponent({
  name: "MessageRetryingText",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.RetryingText, attrs, {
        ...slots,
        default: ({ state }: { state: { text: string } }) => state.text,
      });
  },
});

/** Shown while `onRetryNow` is set. "Retry now", unless you pass children. */
export const MessageRetryNow = defineComponent({
  name: "MessageRetryNow",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.RetryNow, attrs, { ...slots, default: slots.default ?? labelled });
  },
});

/** Shown while `onCancelRetry` is set. "Cancel", unless you pass children. */
export const MessageCancelRetry = defineComponent({
  name: "MessageCancelRetry",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.CancelRetry, attrs, { ...slots, default: slots.default ?? labelled });
  },
});

const retrying = () => [
  h(MessageRetryingIcon),
  h("span", null, [h(MessageRetryingReason), " ", h(MessageRetryingText)]),
  h(MessageRetryNow),
  h(MessageCancelRetry),
];

/**
 * Shown after the content while `retry` is set and the request hasn't failed: a running mark, the reason, the
 * countdown and attempt, then Retry now and Cancel, unless you pass children.
 */
export const MessageRetrying = defineComponent({
  name: "MessageRetrying",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.Retrying, attrs, { ...slots, default: slots.default ?? retrying });
  },
});

export const MessageContent = message.Content;

/** Ends the edit without saving, as Escape does. "Cancel", unless you pass children. */
export const MessageEditCancel = defineComponent({
  name: "MessageEditCancel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.EditCancel, attrs, { ...slots, default: slots.default ?? (() => "Cancel") });
  },
});

/** Saves the edit, as Enter does. "Save", unless you pass children. */
export const MessageEditSave = defineComponent({
  name: "MessageEditSave",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.EditSave, attrs, { ...slots, default: slots.default ?? (() => "Save") });
  },
});

const editActions = () => [h(MessageEditCancel), h(MessageEditSave)];

/** Cancel and Save, shown while the message is edited. Enter and Escape do the same. */
export const MessageEditActions = defineComponent({
  name: "MessageEditActions",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(message.EditActions, attrs, { ...slots, default: slots.default ?? editActions });
  },
});

/**
 * Shown in place of the content while a user message is edited. Its default slot is what follows the text area:
 * `<MessageEditActions />` unless you pass your own, or an empty slot for none.
 */
export const MessageEditor = defineComponent({
  name: "MessageEditor",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => [
      h(message.Editor, attrs, slots.render ? { render: slots.render } : undefined),
      slots.default ? slots.default() : h(MessageEditActions),
    ];
  },
});

/** Shown once the message settles. Holds the branch switcher and a `KindToolbar` of actions. */
export const MessageToolbar = message.Toolbar;
/** Wrap a `KindToolbarButton` in each action: `<MessageCopy><KindToolbarButton aria-label="Copy" /></MessageCopy>`. */
export const MessageCopy = message.Copy;

type RegenerateOption = MessageRegenerateContentState["options"][number];

const Rows: FunctionalComponent<{ options: RegenerateOption[] }> = ({ options }): VNode[] =>
  options.map((option) =>
    option.items
      ? h(KindMenuSub, { key: option.id }, () => [
          h(KindMenuSubTrigger, null, () => [
            h(KindMenuItemContent, {
              icon: option.icon,
              label: option.label,
              description: option.description,
            }),
            h("span", { "data-menu-chevron": "" }),
          ]),
          h(KindMenuSubContent, null, () => h(Rows, { options: option.items as RegenerateOption[] })),
        ])
      : h(KindMenuItem, { key: option.id, value: option.id, label: option.label }, () =>
          h(KindMenuItemContent, { icon: option.icon, label: option.label, description: option.description }),
        ),
  );
Rows.props = ["options"];

/** The regenerate menu's rows: "Try again", a separator, then the options, a submenu for each with `items`. */
export const MessageRegenerateRows = defineComponent({
  name: "MessageRegenerateRows",
  props: {
    tryAgain: { type: Object as PropType<RegenerateOption>, required: true },
    options: { type: Array as PropType<RegenerateOption[]>, required: true },
  },
  setup(props) {
    return () => [
      h(Rows, { options: [props.tryAgain] }),
      h(KindMenuSeparator),
      h(Rows, { options: props.options }),
    ];
  },
});

/**
 * The regenerate menu: UI SDK's `MenuContent` holding the rows unless you pass a default slot, which gets the rows'
 * state (`v-slot="{ state }"`, with `state.tryAgain` and `state.options`). Attributes go to it.
 */
export const MessageRegenerateContent = defineComponent({
  name: "MessageRegenerateContent",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.RegenerateContent, null, {
        render: slots.render,
        default: ({ state }: { state: MessageRegenerateContentState }) => {
          // Each key by name: the slot's state lists none, so a spread or `v-bind` would be empty.
          const rows: MessageRegenerateContentState = { tryAgain: state.tryAgain, options: state.options };
          // Hidden from agents, which use the Message's own `regenerate`. Kept in the page while closed, as on web,
          // so the mark keeps Menu out of the snapshot while only its trigger would show.
          return h(
            KindMenuContent,
            { align: "start", sideOffset: 6, keepMounted: true, "data-agent-hidden": "", ...attrs },
            () => (slots.default ? slots.default({ state: rows }) : h(MessageRegenerateRows, rows)),
          );
        },
      });
  },
});

// The first element the slot holds, the toolbar button the trigger renders as.
const firstElement = (nodes: VNode[]): VNode | undefined => {
  for (const node of nodes) {
    if (!isVNode(node) || node.type === Comment || node.type === Text) continue;
    if (node.type === Fragment) {
      const inner = firstElement(node.children as VNode[]);
      if (inner) return inner;
      continue;
    }
    return node;
  }
  return undefined;
};

/**
 * Wraps the toolbar button that regenerates. While the message has `regenerateOptions`, the button opens a menu of
 * them instead, rendered through UI SDK's `MenuTrigger`, so it keeps its place in the toolbar's arrow-key order. The
 * `#menuContent` slot replaces the menu, `<MessageRegenerateContent />` by default.
 */
export const MessageRegenerate = defineComponent({
  name: "MessageRegenerate",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.Regenerate, attrs, {
        render: slots.render,
        default: ({ state }: { state: MessageRegenerateState }) => {
          const children = slots.default?.() ?? [];
          const menu = state.menu;
          const button = menu ? firstElement(children) : undefined;
          if (!menu || !button) return children;
          // Each key by name: the slot's state lists none, so a spread would be empty.
          const menuProps = {
            controller: menu.controller,
            presentation: menu.presentation,
            open: menu.open,
            onOpenChange: menu.onOpenChange,
            onAction: menu.onAction,
            onCheckedChange: menu.onCheckedChange,
            onValueChange: menu.onValueChange,
          };
          return h(KindMenu, menuProps, () => [
            h(message.RegenerateTrigger, null, () =>
              h(MenuTrigger, null, {
                render: ({ props }: { props: Record<string, unknown> }) => cloneVNode(button, props, true),
              }),
            ),
            slots.menuContent ? slots.menuContent() : h(MessageRegenerateContent),
          ]);
        },
      });
  },
});

export const MessageEdit = message.Edit;
export const MessageBranch = message.Branch;
export const MessageBranchPrevious = message.BranchPrevious;
/** Shows the branch, like "2 of 3". */
export const MessageBranchLabel = defineComponent({
  name: "MessageBranchLabel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(message.BranchLabel, attrs, {
        ...slots,
        default: ({ state }: { state: { label: string } }) => state.label,
      });
  },
});
export const MessageBranchNext = message.BranchNext;
