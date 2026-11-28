import {
  type MenuPartState,
  type ThreadListDialogState,
  type ThreadListGridState,
  type ThreadListLinkState,
  type ThreadListMenuContentState,
  type ThreadListState,
  type ThreadListSummaryState,
  type ThreadListTimeState,
  threadListPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type Slots, type SlotsType, type VNode, type VNodeChild } from "vue";
import {
  KindAlertDialog,
  KindAlertDialogBackdrop,
  KindAlertDialogContent,
  KindAlertDialogDescription,
  KindAlertDialogTitle,
} from "./internal/alert-dialog.js";
import { KindMenu, KindMenuContent, KindMenuItem, menuProps } from "./internal/menu.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// the callbacks whose presence offers an action (New chat, the menu's items, `select`, loading more) are declared
// function props instead, which `@select`, `@new`, `@pin-change`, `@share` and `@load-more` bind.
const primitive = Object.defineProperty(
  Object.assign((options: never) => threadListPrimitive(options), threadListPrimitive, {
    options: {
      ...threadListPrimitive.options,
      onSelect: "action",
      onNew: "action",
      onPinChange: "action",
      onShare: "action",
      onLoadMore: "action",
    },
  }),
  "name",
  { value: threadListPrimitive.name },
) as typeof threadListPrimitive;

const parts = createParts(primitive, {
  root: "nav",
  new: "button",
  viewport: "div",
  grid: "div",
  heading: "div",
  "heading-cell": "div",
  row: "div",
  "link-cell": "div",
  link: "a",
  status: "span",
  unread: "span",
  summary: "span",
  time: "span",
  editor: "input",
  "more-cell": "div",
  more: "button",
  unarchive: "button",
  "fold-row": "div",
  "fold-cell": "div",
  fold: "button",
  empty: "p",
  menu: "div",
  "menu-content": "div",
  dialog: "div",
  "dialog-error": "span",
  "dialog-cancel": "button",
  "dialog-delete": "button",
  end: "div",
  retry: "button",
});

// A part with default children, unless the host passes its own default slot.
const withDefault = <Part extends object>(
  name: string,
  part: Part,
  children: (scope: { state: never }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? children } as Slots);
    },
  }) as unknown as Part;

// Slots a row's parts hand each other only read the row's `value` and the part's own state, so they're marked stable:
// a part that renders again, for its own state, doesn't render the parts inside it again, as React's elements don't.
const stable = (render: (scope: { state: never }) => VNodeChild) =>
  ({ default: render, $stable: true }) as unknown as Slots;

/** Scrolls the rows, of which it renders only those in view. Holds a `ThreadListGrid` and a `ThreadListEnd`. */
export const ThreadListViewport = parts.Viewport;

/** Calls `onNew`. Reads "New chat" unless you pass a slot. Rendered only while `@new` is bound. */
export const ThreadListNew = withDefault("ThreadListNew", parts.New, () => [
  h("span", { "data-thread-list-icon": "new", "aria-hidden": "true" }),
  "New chat",
]);

/** "Nothing is waiting on you." when grouped by status with nothing waiting or running, unless you pass a slot. */
export const ThreadListEmpty = withDefault(
  "ThreadListEmpty",
  parts.Empty,
  ({ state }: { state: { text: string } }) => state.text,
);

const heading = ({ state }: { state: { label: string; count: string } }) =>
  state.count ? [state.label, " ", h("span", { "data-thread-list-count": "" }, state.count)] : state.label;

/**
 * A group's heading, by its row key, with its count when grouped by status. A Vue component updates only when its
 * props change, as React's `memo` does.
 */
export const ThreadListHeading = defineComponent({
  name: "ThreadListHeading",
  inheritAttrs: false,
  props: { value: { type: String, required: true } },
  slots: Object as SlotsType<{ render?: Record<string, unknown> }>,
  setup(props, { attrs, slots }) {
    return () => {
      const cell = () => h(parts.HeadingCell, { value: props.value }, stable(heading));
      // A host's `#render` slot may change, so the heading renders again with it.
      return h(
        parts.Heading,
        { ...attrs, value: props.value },
        slots.render ? { default: cell, render: slots.render } : stable(cell),
      );
    };
  },
});

const fold = ({ state }: { state: { label: string } }) => [
  h("span", { "data-thread-list-icon": "fold", "aria-hidden": "true" }),
  state.label,
];

/**
 * The row after "Done"'s threads: "12 more done", which shows a page more, then "Show less". A Vue component updates
 * only when its props change, as React's `memo` does.
 */
export const ThreadListFold = defineComponent({
  name: "ThreadListFold",
  inheritAttrs: false,
  props: { value: { type: String, required: true } },
  setup(props, { attrs }) {
    return () =>
      h(
        parts.FoldRow,
        { ...attrs, value: props.value },
        stable(() =>
          h(
            parts.FoldCell,
            { value: props.value },
            stable(() => h(parts.Fold, { value: props.value }, stable(fold))),
          ),
        ),
      );
  },
});

const summary = ({ state }: { state: ThreadListSummaryState }) => {
  const pieces = state.pieces.map((piece, index) => (index % 2 ? h("code", piece) : piece));
  if (!state.lead) return pieces;
  return pieces.length > 0 ? [state.lead, " · ", ...pieces] : state.lead;
};

/** A thread's link: its title and its one mark, then its second line, unless you pass a slot. */
export const ThreadListLink = withDefault(
  "ThreadListLink",
  parts.Link,
  ({ state }: { state: ThreadListLinkState }) => [
    h("span", { "data-thread-list-title": "" }, state.title),
    h(parts.Status, { value: state.value }),
    h(parts.Unread, { value: state.value }),
    h(parts.Summary, { value: state.value }, stable(summary)),
  ],
);

const ellipsis = () => h("span", { "data-thread-list-icon": "more", "aria-hidden": "true" });
const time = ({ state }: { state: ThreadListTimeState }) => state.label;
const unarchive = ({ state }: { state: { label: string } }) => state.label;

/**
 * A thread's row, by its id: its link, which also opens the row's menu on a right-click or Shift+F10, how long ago it
 * changed, and its More button, or Unarchive in the archived view, which takes the time's place on hover and focus. The default slot, given
 * `{ state: { value, title } }`, replaces what the link shows. A Vue component updates only when its props change,
 * as React's `memo` does; a slot passed from a render function counts as a change, so leave it out of rows you
 * render in bulk, or mark it `$stable`.
 */
export const ThreadListRow = defineComponent({
  name: "ThreadListRow",
  inheritAttrs: false,
  props: { value: { type: String, required: true } },
  slots: Object as SlotsType<{ default?: { state: ThreadListLinkState }; render?: Record<string, unknown> }>,
  setup(props, { attrs, slots }) {
    return () => {
      const value = props.value;
      const link = slots.default;
      // A host's link slot may change, so the parts that lead to it render again with it.
      const toLink = link ? (render: () => VNodeChild) => ({ default: render }) : stable;
      const row = (render: () => VNodeChild) =>
        slots.render ? { default: render, render: slots.render } : toLink(render);
      return h(
        parts.Row,
        { ...attrs, value },
        row(() => [
          h(
            parts.LinkCell,
            { value },
            toLink(() => [
              h(
                ThreadListLink,
                { value },
                link
                  ? {
                      default: ({ state }: { state: ThreadListLinkState }) =>
                        link({ state: { value: state.value, title: state.title } }),
                    }
                  : undefined,
              ),
              h(parts.Editor, { value, type: "text" }),
              h(parts.Time, { value }, stable(time)),
            ]),
          ),
          h(
            parts.MoreCell,
            { value },
            stable(() => [
              h(parts.More, { value, "data-kind-icon-button": "", "data-kind-size": "sm" }, stable(ellipsis)),
              h(parts.Unarchive, { value }, stable(unarchive)),
            ]),
          ),
        ]),
      );
    };
  },
});

const rows = ({ state }: { state: ThreadListGridState }) =>
  state.visible.map((item) => {
    const type = state.rows[item.index]?.type;
    if (type === "heading") return h(ThreadListHeading, { key: item.key, value: item.key });
    if (type === "fold") return h(ThreadListFold, { key: item.key, value: item.key });
    return h(ThreadListRow, { key: item.key, value: item.key });
  });

/**
 * A `ThreadListHeading`, `ThreadListRow` or `ThreadListFold` for each row in view, unless you pass a slot, which gets
 * `{ state }`.
 */
export const ThreadListGrid = withDefault("ThreadListGrid", parts.Grid, rows);

const items = (state: ThreadListMenuContentState) =>
  state.actions.map((action) =>
    h(
      KindMenuItem,
      {
        key: action.value,
        value: action.value,
        "data-destructive": action.value === "delete" ? "" : undefined,
      },
      () => [h("span", { "data-thread-list-icon": action.value, "aria-hidden": "true" }), action.label],
    ),
  );

/**
 * UI SDK's `MenuContent` with Rename, Pin or Unpin, Share and Delete, each while its callback is set. A default slot,
 * given `{ state: { finalFocus, thread, actions } }`, replaces the items. Attributes go to the `MenuContent`.
 */
export const ThreadListMenuContent = defineComponent({
  name: "ThreadListMenuContent",
  inheritAttrs: false,
  slots: Object as SlotsType<{
    default?: { state: ThreadListMenuContentState };
    render?: Record<string, unknown>;
  }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.MenuContent, null, {
        default: ({ state }: { state: ThreadListMenuContentState }) => {
          const plain = { finalFocus: state.finalFocus, thread: state.thread, actions: state.actions };
          // Hidden from agents, which use the Thread List's own actions. Kept mounted, so Menu never shows up beside it.
          return h(
            KindMenuContent,
            {
              align: "end",
              sideOffset: 4,
              finalFocus: plain.finalFocus,
              keepMounted: true,
              "data-agent-hidden": "",
              ...attrs,
            },
            {
              default: () => (slots.default ? slots.default({ state: plain }) : items(plain)),
              render: slots.render,
            },
          );
        },
      });
  },
});

/** UI SDK Menu, shared by every row, holding a `ThreadListMenuContent` unless you pass a slot. */
export const ThreadListMenu = defineComponent({
  name: "ThreadListMenu",
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_, { slots }) {
    return () =>
      h(parts.Menu, null, {
        default: ({ state }: { state: MenuPartState }) =>
          h(KindMenu, menuProps(state), { default: slots.default ?? (() => h(ThreadListMenuContent)) }),
      });
  },
});

/** "Couldn't delete. Try again." after a delete fails, unless you pass a slot. */
export const ThreadListDialogError = withDefault(
  "ThreadListDialogError",
  parts.DialogError,
  () => "Couldn't delete. Try again.",
);

/** Closes the dialog. Reads "Cancel" unless you pass a slot. */
export const ThreadListDialogCancel = withDefault(
  "ThreadListDialogCancel",
  parts.DialogCancel,
  () => "Cancel",
);

/** Calls `onDelete`. Reads "Delete" unless you pass a slot. */
export const ThreadListDialogDelete = withDefault(
  "ThreadListDialogDelete",
  parts.DialogDelete,
  () => "Delete",
);

const answers = () =>
  h("div", { "data-thread-list-answers": "" }, [
    h(ThreadListDialogError),
    h(ThreadListDialogCancel),
    h(ThreadListDialogDelete),
  ]);

/**
 * The Alert Dialog Delete opens: "Delete chat?", the thread's title, and Cancel and Delete, unless you pass a slot for
 * the answers. Rendered only while `onDelete` is set and `confirmDelete` is on.
 */
export const ThreadListDialog = defineComponent({
  name: "ThreadListDialog",
  slots: Object as SlotsType<{ default?: () => VNode[] }>,
  setup(_, { slots }) {
    return () =>
      h(parts.Dialog, null, {
        default: ({ state }: { state: ThreadListDialogState }) =>
          h(KindAlertDialog, { controller: state.controller, dismissible: state.dismissible }, () => [
            h(KindAlertDialogBackdrop),
            h(
              KindAlertDialogContent,
              { initialFocus: state.initialFocus, finalFocus: state.finalFocus },
              () => [
                h(KindAlertDialogTitle, null, () => state.title),
                h(KindAlertDialogDescription, null, () => state.description),
                slots.default ? slots.default() : answers(),
              ],
            ),
          ]),
      });
  },
});

/** Calls `onLoadMore` again. Reads "Retry" unless you pass a slot. */
export const ThreadListRetry = withDefault("ThreadListRetry", parts.Retry, () => "Retry");

/** After the rows while loading more: "Loading more chats", or "Couldn't load more chats" and Retry. */
export const ThreadListEnd = withDefault(
  "ThreadListEnd",
  parts.End,
  ({ state }: { state: { status: ThreadListState["loadStatus"] } }) =>
    state.status === "loading"
      ? [
          h("span", { "aria-hidden": "true", "data-status-mark": "", "data-status": "running" }),
          "Loading more chats",
        ]
      : ["Couldn't load more chats", h(ThreadListRetry)],
);

const defaultParts = () => [
  h(ThreadListNew),
  h(ThreadListEmpty),
  h(
    ThreadListViewport,
    null,
    stable(() => [h(ThreadListGrid), h(ThreadListEnd)]),
  ),
  h(ThreadListMenu),
  h(ThreadListDialog),
];

/**
 * The threads as a navigation grid, grouped by pinned, the host's groups and date, or by what each run needs from the
 * person with `groupBy="status"`, with New chat above and one menu of Rename, Pin, Share, Archive and Delete for every
 * row. A default slot replaces the default parts.
 */
export const ThreadList = withDefault("ThreadList", parts.Root, defaultParts);
