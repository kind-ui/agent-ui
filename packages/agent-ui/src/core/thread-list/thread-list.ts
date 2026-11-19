import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  type ChangeSource,
  createFocusRecovery,
  createGridFocus,
  createInlineEdit,
  createTypeahead,
  createVirtualizer,
  css,
  definePrimitive,
  dispatch,
  type GridCell,
  type GridFocus,
  type InlineEdit,
  isTypeaheadKey,
  type SlotDefinition,
  selects,
  type VirtualItem,
} from "@ui-sdk/core";
import { type AlertDialogController, createAlertDialogController } from "@ui-sdk/core/alert-dialog";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Thread } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { hearComposed } from "../composed-events.js";
import { memo } from "../memo.js";
import {
  type MenuBaseApi,
  type MenuBaseOptions,
  type MenuBaseState,
  type MenuPartState,
  menuBase,
} from "../menu-base.js";
import { createPendingAction } from "../pending.js";
import { holdTransitions } from "../step/base.js";
import { type ThreadGroupOptions, threadGroups } from "../thread-groups.js";
import { todayKey } from "../time.js";

/** `"item-press"`: a person pressed the link or a menu item. `"imperative"`: an `api` call, like an agent's. */
export type ThreadListReason = "item-press" | "imperative";

/** Why `onLoadMore` was called: the list neared its end, or a person pressed Retry. */
export type ThreadListLoadReason = "end-reached" | "retry-press";

/** What a row's menu offers, by value. */
export type ThreadListAction = "rename" | "pin" | "share" | "delete";

export type ThreadListOptions = Pick<MenuBaseOptions, "presentation" | "motion"> & {
  /**
   * The threads, in the host's order inside each group. Ids are unique and don't start with `heading:`, which group
   * headings' row keys use.
   * @default []
   */
  threads?: Thread[];
  /** The current thread's id, marked `aria-current="page"`. The host owns it, as a route is. */
  value?: string | null;
  /**
   * Names the list.
   * @default "Chats"
   */
  label?: string;
  /** Called when a person follows a thread's link, or on `select`. Cancel it to route without navigating. */
  onSelect?: (id: string, details: ChangeDetails<ThreadListReason>) => void;
  /** Called by New chat, which shows while it's set. `details.source` says who pressed it. */
  onNew?: (details: ActionDetails) => void;
  /**
   * Called when a person renames a thread in place, with the new title in `details.title`. The title shown stays the
   * host's: return a promise to lock renaming until it settles. A rejection is announced.
   */
  onRename?: (id: string, details: ActionDetails & { title: string }) => unknown;
  /** Called by Pin and Unpin, with what the thread should become in `details.pinned`. */
  onPinChange?: (id: string, details: ChangeDetails<ThreadListReason> & { pinned: boolean }) => void;
  /** Called by Share. */
  onShare?: (id: string, details: ChangeDetails<ThreadListReason>) => void;
  /**
   * Called by the dialog's Delete, or by Delete when `confirmDelete` is off. Return a promise to keep the dialog
   * open until it settles: a rejection keeps it open with an error.
   */
  onDelete?: (id: string, details: ActionDetails) => unknown;
  /**
   * Whether Delete asks first, in a dialog. Turn it off when the host offers Undo instead.
   * @default true
   */
  confirmDelete?: boolean;
  /**
   * Whether there are older threads to load.
   * @default false
   */
  hasMore?: boolean;
  /** Called once as the list nears its end while `hasMore`, and by Retry after a failed load. */
  onLoadMore?: (details: { reason: ThreadListLoadReason }) => void;
  /**
   * How loading more threads is going: `"loading"` shows a loading row at the end, `"error"` an error row with Retry.
   * @default "idle"
   */
  status?: "idle" | "loading" | "error";
  /**
   * Today, as an ISO date or instant, which picks the date groups. Pass it when the server renders the list, so its
   * markup and the browser's group the same threads.
   * @default todayKey(timeZone)
   */
  now?: string;
  /** A BCP 47 tag for the month, year and relative group names. Defaults to English. */
  locale?: string;
  /** The IANA time zone that decides a thread's day. Defaults to UTC. */
  timeZone?: string;
  /** Replaces the fixed groups' words ("Pinned", "Today", "Previous 7 days"), by key. */
  groupLabels?: ThreadGroupOptions["labels"];
};

/** A row of the grid: a group's heading, or a thread. */
export type ThreadListRow =
  | { type: "heading"; key: string; label: string }
  | { type: "thread"; key: string; thread: Thread };

/** A row and where it sits, kept as one object while both stay the same. */
export type ThreadListEntry = ThreadListRow & { index: number };

export type ThreadListState = MenuBaseState & {
  /** The groups' headings and threads, in order. */
  rows: readonly ThreadListRow[];
  /** Each row by its key: a thread's id, or `heading:<group key>`. */
  entries: Readonly<Record<string, ThreadListEntry>>;
  /** The rows to render, from `createVirtualizer`. */
  visible: readonly VirtualItem[];
  /** Where each rendered row starts, in pixels, by its key. */
  starts: Readonly<Record<string, number>>;
  /** The rows' full height, in pixels. */
  size: number;
  /** The cell with the grid's Tab stop, or `null` before the grid is entered. */
  active: GridCell | null;
  /** The active cell as `<id>:<column>`, which each cell selects on. */
  focused: string | null;
  /** The `value` option. */
  value: string | null;
  /** The thread the menu was last opened for. */
  menuFor: string | null;
  /** The thread whose menu is open. */
  menuOpenFor: string | null;
  /** The thread being renamed. */
  renaming: string | null;
  /** Whether a promise `onRename` returned is still pending. */
  renamePending: boolean;
  /** The thread the delete dialog asks about. */
  deleting: string | null;
  /** Whether a promise `onDelete` returned is still pending. */
  deletePending: boolean;
  /** Whether the last delete failed, until Delete is pressed again or the dialog opens again. */
  deleteFailed: boolean;
  canSelect: boolean;
  canNew: boolean;
  canRename: boolean;
  canPin: boolean;
  canShare: boolean;
  canDelete: boolean;
  /** The `confirmDelete` option. */
  confirmDelete: boolean;
  /** The `hasMore` option. */
  hasMore: boolean;
  /** The `status` option. */
  loadStatus: "idle" | "loading" | "error";
  canLoadMore: boolean;
};

/** What the grid hands render functions: the rows to render, each a `ThreadListRow` of `rows` by its `index`. */
export type ThreadListGridState = { visible: readonly VirtualItem[]; rows: readonly ThreadListRow[] };

/** What the link hands render functions: its thread's id and title. */
export type ThreadListLinkState = { value: string; title: string };

/** What the menu content slot hands render functions: the open thread and what its menu offers. */
export type ThreadListMenuContentState = {
  /** Pass it to `MenuContent`: where focus goes when the menu closes. */
  finalFocus: () => HTMLElement | null;
  /** The thread the menu is for. */
  thread: Thread | undefined;
  /** The menu's items, in order. */
  actions: { value: ThreadListAction; label: string }[];
};

export type ThreadListDialogState = {
  /** Pass it to the Alert Dialog as its `controller`. */
  controller: AlertDialogController;
  /** Pass it to the Alert Dialog. False while a delete is pending, so Escape waits for it. */
  dismissible: boolean;
  /** Pass it to the Alert Dialog content: Cancel's selector, the least destructive answer. */
  initialFocus: string;
  /** Pass it to the Alert Dialog content: the thread's More button, else the row that took its place. */
  finalFocus: () => HTMLElement | null;
  /** "Delete chat?" */
  title: string;
  /** The thread's title. */
  description: string;
};

type Cell = { value: string };

type Recovery = ReturnType<typeof createFocusRecovery<Cell>>;

export type ThreadListApi = {
  /** Follows a thread's link: calls `onSelect`, then goes to its `href` unless cancelled. Offered while `onSelect` is set. */
  readonly select: ((id: string) => boolean) | undefined;
  /** Calls `onNew`. Offered while it's set. */
  readonly newThread: ((event?: Event) => void) | undefined;
  /** Renames a thread through `onRename`. Offered while it's set and no rename is pending. */
  readonly rename: ((id: string, title: string) => boolean) | undefined;
  /** Pins a thread, or with `false` unpins it; without `pinned`, toggles it. Offered while `onPinChange` is set. */
  readonly pin: ((id: string, pinned?: boolean) => boolean) | undefined;
  /** Calls `onShare`. Offered while it's set. */
  readonly share: ((id: string) => boolean) | undefined;
  /**
   * Opens the delete dialog for a thread, whose Delete calls `onDelete`, or calls it at once with `confirmDelete` off.
   * Offered while `onDelete` is set and no delete is pending.
   */
  readonly delete: ((id: string) => boolean) | undefined;
  /** The threads by id and title, for agents. */
  threadItems: () => { value: string; label: string }[];
  /** The row menu, built on `menuBase`. */
  menu: MenuBaseApi;
  /** One Tab stop over the links and More buttons. */
  grid: GridFocus;
  /** Renames in place. */
  inlineEdit: InlineEdit;
  /** Called by the viewport slot: connects the virtualizer. */
  bindViewport: (el: HTMLElement) => () => void;
  /** Called by the link and More: joins the grid at the row its thread sits in now. */
  bindCell: (el: HTMLElement, part: { props: Cell }, col: number) => () => void;
  /** Called by a link or More as it takes focus: moves the Tab stop to it. */
  focusCell: (id: string, col: number) => void;
  /** Called by the link: the grid's keys, typeahead and F2. */
  linkKeydown: (event: KeyboardEvent, id: string) => void;
  /** Called by the link: `onSelect`, then the browser follows the link unless it was cancelled. */
  follow: (event: MouseEvent, id: string) => void;
  /** Called by More: opens the menu for its thread. */
  openMenu: (id: string, event?: Event) => void;
  /** Called by the link's `contextmenu`, which a right-click, Shift+F10 and the context-menu key fire: opens its menu. */
  openContextMenu: (id: string, event: MouseEvent) => void;
  /** Called by the dialog's Delete. */
  confirmDelete: (event?: Event) => void;
  /** Called by the dialog's Cancel. */
  cancelDelete: (event?: Event) => void;
  /** Called by Retry: asks for more threads again. */
  retry: () => void;
  /** Moves focus to a neighbor when a focused link, More button or editor leaves. */
  recovery: { link: Recovery; more: Recovery; editor: Recovery };
  /** Slot states, memoized. */
  menuContentState: (state: ThreadListState) => ThreadListMenuContentState;
  dialogState: (state: ThreadListState) => ThreadListDialogState;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ThreadListState, ThreadListApi, Props, Public>;

type RowProps = BaseSlotProps & Cell;

type ThreadListSlots = {
  root: Slot;
  new: Slot;
  viewport: Slot;
  grid: Slot<BaseSlotProps, ThreadListGridState>;
  heading: Slot<RowProps>;
  "heading-cell": Slot<RowProps, { label: string }>;
  row: Slot<RowProps>;
  "link-cell": Slot<RowProps>;
  link: Slot<RowProps, ThreadListLinkState>;
  status: Slot<RowProps>;
  unread: Slot<RowProps>;
  editor: Slot<RowProps>;
  "more-cell": Slot<RowProps>;
  more: Slot<RowProps>;
  menu: Slot<BaseSlotProps, MenuPartState>;
  "menu-content": Slot<BaseSlotProps, ThreadListMenuContentState>;
  dialog: Slot<BaseSlotProps, ThreadListDialogState>;
  "dialog-error": Slot;
  "dialog-cancel": Slot;
  "dialog-delete": Slot<BaseSlotProps, { pending: boolean }>;
  end: Slot<BaseSlotProps, { status: ThreadListState["loadStatus"] }>;
  retry: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ThreadListPrimitive = ReturnType<
  typeof definePrimitive<ThreadListOptions, ThreadListState, ThreadListApi, ThreadListSlots>
>;

const NO_THREADS: Thread[] = [];
// The rows' height before the viewport binds and reads `--kind-thread-row-height`.
const ROW_HEIGHT = 36;
const STATUS_LABELS: Record<NonNullable<Thread["status"]>, string> = {
  running: "Running",
  "awaiting-input": "Needs input",
  error: "Failed",
};

/** The threads as grid rows: each group's heading, then its threads. */
export const threadListRows = (threads: readonly Thread[], options: ThreadGroupOptions): ThreadListRow[] =>
  threadGroups(threads, options).flatMap((group): ThreadListRow[] => [
    { type: "heading", key: `heading:${group.key}`, label: group.label },
    ...group.threads.map((thread) => ({ type: "thread" as const, key: thread.id, thread })),
  ]);

// Equal entries keep their objects, so a cell hears only about its own row.
const entriesOf = (
  rows: readonly ThreadListRow[],
  previous: Readonly<Record<string, ThreadListEntry>>,
): Record<string, ThreadListEntry> => {
  const entries: Record<string, ThreadListEntry> = {};
  rows.forEach((row, index) => {
    const before = previous[row.key];
    const same =
      before?.index === index &&
      (row.type === "heading"
        ? before.type === "heading" && before.label === row.label
        : before.type === "thread" && before.thread === row.thread);
    entries[row.key] = same ? before : { ...row, index };
  });
  return entries;
};

// The first screenful of rows, before the viewport binds and the virtualizer measures, so server markup shows them.
const firstVisible = (rows: readonly ThreadListRow[]): VirtualItem[] =>
  rows
    .slice(0, 20)
    .map((row, index) => ({ index, key: row.key, start: index * ROW_HEIGHT, size: ROW_HEIGHT }));

const startsOf = (visible: readonly VirtualItem[]) =>
  Object.fromEntries(visible.map((item) => [item.key, item.start]));

const can = (options: ThreadListOptions) => ({
  canSelect: options.onSelect !== undefined,
  canNew: options.onNew !== undefined,
  canRename: options.onRename !== undefined,
  canPin: options.onPinChange !== undefined,
  canShare: options.onShare !== undefined,
  canDelete: options.onDelete !== undefined,
});

type Abilities = Pick<ThreadListState, "canRename" | "canPin" | "canShare" | "canDelete">;

const menuActions = (abilities: Abilities, pinned: boolean) => [
  ...(abilities.canRename ? [{ value: "rename" as const, label: "Rename" }] : []),
  ...(abilities.canPin ? [{ value: "pin" as const, label: pinned ? "Unpin" : "Pin" }] : []),
  ...(abilities.canShare ? [{ value: "share" as const, label: "Share" }] : []),
  ...(abilities.canDelete ? [{ value: "delete" as const, label: "Delete" }] : []),
];

const hasMenu = (abilities: Abilities) =>
  abilities.canRename || abilities.canPin || abilities.canShare || abilities.canDelete;

// One array per set of actions, since `menuBase` asks for one array per input.
const menuData = new Map<string, MenuData>();
const toData = (options: ThreadListOptions): MenuData => {
  const actions = menuActions(can(options), false);
  const key = actions.map((action) => action.value).join();
  let data = menuData.get(key);
  if (!data) {
    data = actions;
    menuData.set(key, data);
  }
  return data;
};

// `menuBase` calls one module-level `onAction`, so each instance leaves its own here.
const actionsByContext = new WeakMap<object, (action: string, source: ChangeSource, event?: Event) => void>();

const base = menuBase<ThreadListOptions>({
  kind: "thread-list",
  label: "Chats",
  toData,
  canOpen: (options) => hasMenu(can(options)),
  onAction: (value, { event, source }, context) => actionsByContext.get(context)?.(value, source, event),
});

const groupOptions = (options: ThreadListOptions): ThreadGroupOptions => ({
  now: options.now ?? todayKey(options.timeZone),
  locale: options.locale,
  timeZone: options.timeZone,
  labels: options.groupLabels,
});

// Reads `options` rather than spreading it: on Web Components, `@ui-sdk/web` fills in the callbacks on read.
const presentation = (options: ThreadListOptions) => ({
  ...can(options),
  confirmDelete: options.confirmDelete ?? true,
  hasMore: options.hasMore ?? false,
  loadStatus: options.status ?? "idle",
  canLoadMore: options.onLoadMore !== undefined,
});

const threadOf = (state: ThreadListState, id: string | null) => {
  const entry = id === null ? undefined : state.entries[id];
  return entry?.type === "thread" ? entry.thread : undefined;
};

const byValue = ({ props }: { props: Cell }) => [props.value];

// A row's parts hear only about their own entry, place and marks, so a change reaches only the rows it changed.
const ownRow = (column?: number) =>
  selects<ThreadListState, ThreadListApi, RowProps>({
    rows: [],
    entries: byValue,
    visible: [],
    starts: byValue,
    size: [],
    active: [],
    focused: ({ props }) =>
      column === undefined ? [`${props.value}:0`, `${props.value}:1`] : [`${props.value}:${column}`],
    value: byValue,
    menuFor: [],
    menuOpenFor: byValue,
    renaming: byValue,
    open: [],
    renamePending: [],
    deleting: [],
    deletePending: [],
    deleteFailed: [],
  });

const outsideRows = selects<ThreadListState, ThreadListApi, BaseSlotProps>({
  rows: [],
  entries: [],
  visible: [],
  starts: [],
  size: [],
  active: [],
  focused: [],
  value: [],
  menuOpenFor: [],
  renaming: [],
});

const rowAttrs = (state: ThreadListState, value: string) => {
  const start = state.starts[value];
  return {
    "aria-rowindex": String((state.entries[value]?.index ?? 0) + 1),
    style: css({ "--kind-thread-row-start": start === undefined ? undefined : `${start}px` }),
  };
};

const cellOf = (state: ThreadListState, id: string, col: number) => ({
  row: state.entries[id]?.index ?? -1,
  col,
});

export const threadListPrimitive: ThreadListPrimitive = definePrimitive<
  ThreadListOptions,
  ThreadListState,
  ThreadListApi,
  ThreadListSlots
>({
  name: "kind-thread-list",
  options: {
    presentation: "string",
    motion: "string",
    threads: "value",
    value: "string",
    label: "string",
    onSelect: "callback",
    onNew: "callback",
    onRename: "action",
    onPinChange: "callback",
    onShare: "callback",
    onDelete: "action",
    confirmDelete: "boolean",
    hasMore: "boolean",
    onLoadMore: "callback",
    status: "string",
    now: "string",
    locale: "string",
    timeZone: "string",
    groupLabels: "value",
  },
  state: (options) => {
    const rows = threadListRows(options.threads ?? NO_THREADS, groupOptions(options));
    const visible = firstVisible(rows);
    return {
      ...base.state(options),
      ...presentation(options),
      value: options.value ?? null,
      rows,
      entries: entriesOf(rows, {}),
      visible,
      starts: startsOf(visible),
      size: rows.length * ROW_HEIGHT,
      active: null,
      focused: null,
      menuFor: null,
      menuOpenFor: null,
      renaming: null,
      renamePending: false,
      deleting: null,
      deletePending: false,
      deleteFailed: false,
    };
  },
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  controlled: ["value"],
  api: (context) => {
    const { store } = context;
    const menu = base.api(context);
    const dialog = createAlertDialogController();
    const renamePending = createPendingAction(context, { state: "renamePending" });
    const deletePending = createPendingAction(context, { state: "deletePending" });
    const typeahead = createTypeahead();
    let rowHeight = ROW_HEIGHT;
    let viewport: HTMLElement | undefined;
    // Where each row sat before the last change, so focus recovery finds the row that took a removed one's place.
    let lastIndex = new Map<string, number>();

    const rowsOf = memo(
      (
        threads: Thread[],
        now: string,
        locale: string | undefined,
        timeZone: string | undefined,
        labels: ThreadGroupOptions["labels"],
      ) => threadListRows(threads, { now, locale, timeZone, labels }),
    );

    const cols = () => (hasMenu(store.get()) ? 2 : 1);
    const keyAt = (row: number) => store.get().rows[row]?.key;
    const isThread = (row: number) => store.get().rows[row]?.type === "thread";

    const virtual = createVirtualizer({
      count: () => store.get().rows.length,
      estimate: () => rowHeight,
      key: (index) => keyAt(index) ?? String(index),
      keep: () => {
        const { active, entries, renaming, menuOpenFor } = store.get();
        return [
          active?.row,
          renaming && entries[renaming]?.index,
          menuOpenFor && entries[menuOpenFor]?.index,
        ].filter((index): index is number => typeof index === "number");
      },
      onEnd: () => {
        atEnd = true;
        loadAtEnd();
      },
    });
    // `onEnd` runs once per row count, so an end reached while loading can't start loads once it can.
    let atEnd = false;
    const loadAtEnd = (options = context.options()) => {
      if (!atEnd || !options.hasMore || !options.onLoadMore || options.status === "loading") return;
      atEnd = false;
      options.onLoadMore({ reason: "end-reached" });
    };
    const showVisible = () => {
      const visible = virtual.items();
      store.set({ visible, starts: startsOf(visible), size: virtual.size() });
    };
    virtual.subscribe(showVisible);

    const grid = createGridFocus(context, {
      key: "active",
      rows: () => store.get().rows.length,
      cols,
      pageSize: () => Math.max(1, Math.floor((viewport?.clientHeight ?? 0) / rowHeight)),
      disabled: (cell) => !isThread(cell.row),
      reveal: (cell) => virtual.scrollToIndex(cell.row),
      onMove: (cell) => store.set({ focused: `${keyAt(cell.row)}:${cell.col}` }),
    });

    // The thread at or after `index` in the rows now, else the last one before it, else -1.
    const threadNear = (index: number) => {
      const { rows } = store.get();
      for (let row = Math.max(0, index); row < rows.length; row++) if (isThread(row)) return row;
      for (let row = Math.min(index, rows.length) - 1; row >= 0; row--) if (isThread(row)) return row;
      return -1;
    };
    const idOf = (focused: string) => focused.slice(0, focused.lastIndexOf(":"));

    // Keeps the Tab stop on its thread when rows move, else on the thread that took its place.
    const settleActive = () => {
      const { active, focused, entries } = store.get();
      if (!active || !focused) return;
      const col = Math.min(active.col, cols() - 1);
      const row = entries[idOf(focused)]?.index ?? threadNear(active.row);
      if (row < 0) return store.set({ active: null, focused: null });
      if (row !== active.row || col !== active.col)
        store.set({ active: { row, col }, focused: `${keyAt(row)}:${col}` });
    };

    // `value` reaches state here rather than through `sync`, since a synced key that changes renders every React part.
    context.onOptions((options) => {
      const value = options.value ?? null;
      if (value !== store.get().value) store.set({ value });
      const { rows: before, entries } = store.get();
      const { now, locale, timeZone, labels } = groupOptions(options);
      const rows = rowsOf(options.threads ?? NO_THREADS, now, locale, timeZone, labels);
      if (rows.length !== before.length) atEnd = false;
      loadAtEnd(options);
      if (rows === before) return;
      lastIndex = new Map(before.map((row, index) => [row.key, index]));
      store.set({ rows, entries: entriesOf(rows, entries) });
      settleActive();
      if (viewport) virtual.refresh();
      else {
        const visible = firstVisible(rows);
        store.set({ visible, starts: startsOf(visible), size: rows.length * ROW_HEIGHT });
      }
    });

    const known = (id: string) => threadOf(store.get(), id) !== undefined;
    const details = (event: Event | undefined) =>
      event ? { reason: "item-press" as const, event } : { reason: "imperative" as const };

    const select = (id: string, event?: Event) =>
      known(id) && !dispatch(context, "onSelect", id, details(event));

    const runRename = (id: string, title: string, source: ChangeSource) => {
      const { onRename } = context.options();
      if (!onRename) return;
      void renamePending
        .run(() => onRename(id, { title, source }))
        ?.then((outcome) => {
          if (outcome === "failed") announce("Chat not renamed", { priority: "polite" });
        });
    };
    const inlineEdit = createInlineEdit(context, {
      key: "renaming",
      value: (id) => threadOf(store.get(), id)?.title ?? "",
      disabled: (id) => !known(id) || store.get().renamePending,
      commit: (id, text, { event }) => {
        const title = text.trim();
        if (!title) return false;
        runRename(id, title, actionSource(event, "enter-key"));
        return true;
      },
    });

    const runDelete = (id: string, source: ChangeSource) => {
      const { onDelete } = context.options();
      if (!onDelete) return;
      store.set({ deleteFailed: false });
      void deletePending
        .run(() => onDelete(id, { source }))
        ?.then((outcome) => {
          if (outcome === "done") dialog.close({ reason: "action" });
          else if (outcome === "failed") {
            store.set({ deleteFailed: true });
            announce("Chat not deleted", { priority: "polite" });
          }
        });
    };
    const requestDelete = (id: string, source: ChangeSource) => {
      if (store.get().deletePending) return;
      if (!store.get().confirmDelete) return runDelete(id, source);
      store.set({ deleting: id, deleteFailed: false });
      void dialog.open();
    };

    const pin = (id: string, pinned: boolean | undefined, event?: Event) => {
      const thread = threadOf(store.get(), id);
      return (
        !!thread &&
        !dispatch(context, "onPinChange", id, { ...details(event), pinned: pinned ?? !thread.pinned })
      );
    };
    const share = (id: string, event?: Event) =>
      known(id) && !dispatch(context, "onShare", id, details(event));

    // Rename and Delete wait for the menu to hand focus back, so the editor or the dialog takes it from there.
    let afterClose: (() => void) | undefined;
    let opener: HTMLElement | null = null;
    actionsByContext.set(context, (action, source, event) => {
      const id = store.get().menuFor;
      if (id === null || !known(id)) return;
      if (action === "rename") afterClose = () => void inlineEdit.start(id);
      else if (action === "delete") afterClose = () => requestDelete(id, source);
      else if (action === "pin") pin(id, undefined, event);
      else if (action === "share") share(id, event);
    });
    let frame = 0;
    context.onDestroy(() => {
      if (frame) cancelAnimationFrame(frame);
    });
    store.subscribe(() => {
      const { open, menuOpenFor } = store.get();
      if (open === (menuOpenFor !== null)) return;
      if (open) {
        const payload = menu.controller.getPayload();
        const id = typeof payload === "string" ? payload : null;
        // Inside a shadow root, the document's active element is the host.
        const focused = (context.element("root")?.getRootNode() as Document | ShadowRoot | undefined)
          ?.activeElement;
        opener = focused instanceof HTMLElement ? focused : null;
        store.set({ menuFor: id, menuOpenFor: id });
        return;
      }
      store.set({ menuOpenFor: null });
      if (afterClose) {
        const run = afterClose;
        afterClose = undefined;
        frame = requestAnimationFrame(run);
      }
    });

    const rowFocus = (id: string, col: number) => {
      const slot = col === 0 ? "link" : "more";
      const own = context.element(slot, id);
      if (own?.isConnected) return own;
      const row = threadNear(store.get().entries[id]?.index ?? lastIndex.get(id) ?? 0);
      const key = row < 0 ? undefined : keyAt(row);
      return (key && context.element(slot, key)) || context.element("new") || null;
    };
    const recoveryFor = (col: number) =>
      createFocusRecovery<Cell>({
        fallback: (lost) => {
          // A thread still in the list only scrolled away, as the grid moved focus to a row it hasn't rendered yet.
          if (store.get().entries[lost.key]) return undefined;
          const row = threadNear(lastIndex.get(lost.key) ?? 0);
          if (row < 0) return context.element("new") ?? undefined;
          // Through the grid, which scrolls the row in when the virtualizer hasn't rendered it.
          grid.focus({ row, col: Math.min(col, cols() - 1) });
          return undefined;
        },
      });

    const menuContentState = memo(
      (thread: Thread | undefined, abilities: Abilities): ThreadListMenuContentState => ({
        finalFocus: () => (opener?.isConnected ? opener : thread ? rowFocus(thread.id, 1) : null),
        thread,
        actions: menuActions(abilities, thread?.pinned ?? false),
      }),
    );
    const abilities = memo(
      (canRename: boolean, canPin: boolean, canShare: boolean, canDelete: boolean): Abilities => ({
        canRename,
        canPin,
        canShare,
        canDelete,
      }),
    );
    const dialogState = memo(
      (dismissible: boolean, id: string | null, thread: Thread | undefined): ThreadListDialogState => ({
        controller: dialog,
        dismissible,
        initialFocus: '[data-slot="kind-thread-list-dialog-cancel"]',
        // By id, since the host may remove the thread before the dialog closes.
        finalFocus: () => (id === null ? null : rowFocus(id, 1)),
        title: "Delete chat?",
        description: thread?.title ?? "",
      }),
    );

    return {
      get select() {
        if (!store.get().canSelect) return undefined;
        return (id: string) => {
          if (!select(id)) return false;
          const href = threadOf(store.get(), id)?.href;
          if (href) location.assign(href);
          return true;
        };
      },
      get newThread() {
        return store.get().canNew
          ? (event?: Event) => context.options().onNew?.({ source: actionSource(event, "new-press") })
          : undefined;
      },
      get rename() {
        const { canRename, renamePending } = store.get();
        if (!canRename || renamePending) return undefined;
        return (id: string, title: string) => {
          if (!known(id) || !title.trim()) return false;
          runRename(id, title.trim(), actionSource(undefined, "imperative"));
          return true;
        };
      },
      get pin() {
        return store.get().canPin ? (id: string, pinned?: boolean) => pin(id, pinned) : undefined;
      },
      get share() {
        return store.get().canShare ? (id: string) => share(id) : undefined;
      },
      get delete() {
        const { canDelete, deletePending } = store.get();
        if (!canDelete || deletePending) return undefined;
        return (id: string) => {
          if (!known(id)) return false;
          requestDelete(id, actionSource(undefined, "imperative"));
          return true;
        };
      },
      threadItems: () =>
        store
          .get()
          .rows.flatMap((row) =>
            row.type === "thread" ? [{ value: row.thread.id, label: row.thread.title }] : [],
          ),
      menu,
      grid,
      inlineEdit,
      bindViewport: (el) => {
        viewport = el;
        rowHeight =
          Number.parseFloat(getComputedStyle(el).getPropertyValue("--kind-thread-row-height")) || ROW_HEIGHT;
        const disconnect = virtual.connect(el);
        showVisible();
        return () => {
          disconnect();
          viewport = undefined;
        };
      },
      // `bind` runs once per element, so a cell whose thread moves to another row joins the grid again there.
      bindCell: (el, part, col) => {
        let row = store.get().entries[part.props.value]?.index;
        let unbind = row === undefined ? undefined : grid.bind(el, { row, col });
        const unsubscribe = store.subscribe(() => {
          const next = store.get().entries[part.props.value]?.index;
          if (next === row) return;
          unbind?.();
          row = next;
          unbind = row === undefined ? undefined : grid.bind(el, { row, col });
        });
        return () => {
          unsubscribe();
          unbind?.();
        };
      },
      focusCell: (id, col) => {
        const cell = cellOf(store.get(), id, col);
        if (cell.row >= 0 && !grid.isActive(store.get(), cell)) grid.focus(cell);
      },
      linkKeydown: (event, id) => {
        if (grid.keydown(event)) return;
        if (event.key === "F2" && store.get().canRename) {
          event.preventDefault();
          inlineEdit.start(id, { reason: "edit-key", event });
          return;
        }
        if (event.defaultPrevented || !isTypeaheadKey(event)) return;
        if (event.key === " " && typeahead.active()) event.preventDefault();
        const { rows, entries } = store.get();
        const titles = rows.map((row) => (row.type === "thread" ? row.thread.title : ""));
        const row = typeahead(event.key, titles, entries[id]?.index ?? -1);
        if (row !== -1) grid.focus({ row, col: 0 }, { reason: "list-navigation", event });
      },
      follow: (event, id) => {
        // A modified click opens the link elsewhere, which isn't a selection.
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (store.get().canSelect && !select(id, event)) event.preventDefault();
      },
      openMenu: (id, event) => {
        const anchor = context.element("more", id);
        if (!anchor) return;
        void menu.controller.open({
          payload: id,
          anchor,
          focus: "first",
          reason: "trigger-press",
          ...(event && { event }),
        });
      },
      // Not UI SDK's `MenuContextTrigger`, which becomes the menu's trigger and so presents every open as a popover,
      // a phone's sheet from More included. iOS fires no `contextmenu`; More always shows on touch screens.
      openContextMenu: (id, event) => {
        if (!hasMenu(store.get())) return;
        event.preventDefault();
        const keyboard = event.button !== 2;
        const anchor = keyboard ? context.element("link", id) : { x: event.clientX, y: event.clientY };
        if (!anchor) return;
        void menu.controller.open({ payload: id, anchor, focus: "first", reason: "trigger-press", event });
      },
      confirmDelete: (event) => {
        const { deleting } = store.get();
        if (deleting !== null && dialog.isOpen()) runDelete(deleting, actionSource(event, "delete-press"));
      },
      cancelDelete: (event) => {
        if (!store.get().deletePending) dialog.close(event ? { reason: "close-press", event } : {});
      },
      retry: () => {
        context.options().onLoadMore?.({ reason: "retry-press" });
      },
      recovery: {
        link: recoveryFor(0),
        more: recoveryFor(1),
        editor: createFocusRecovery<Cell>({
          fallback: (lost) => {
            const row = store.get().entries[lost.key]?.index;
            if (row !== undefined) grid.focus({ row, col: 0 });
            return undefined;
          },
        }),
      },
      menuContentState: (state) =>
        menuContentState(
          threadOf(state, state.menuFor),
          abilities(state.canRename, state.canPin, state.canShare, state.canDelete),
        ),
      dialogState: (state) =>
        dialogState(!state.deletePending, state.deleting, threadOf(state, state.deleting)),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "navigation",
      selects: outsideRows,
      attrs: (state) => ({ "aria-label": state.label, "data-motion": state.motion }),
    }),
    new: slot({
      role: "button",
      focus: "native",
      selects: outsideRows,
      present: (state) => state.canNew,
      press: ({ api }, event) => api.newThread?.(event),
      attrs: () => ({ type: "button" }),
    }),
    viewport: slot({
      selects: outsideRows,
      bind: (el, { api }) => api.bindViewport(el),
    }),
    grid: slot<BaseSlotProps, ThreadListGridState>({
      role: "grid",
      keys: { none: "The links and More buttons in its cells handle them." },
      selects: selects<ThreadListState, ThreadListApi, BaseSlotProps>({
        entries: [],
        starts: [],
        active: [],
        focused: [],
        value: [],
        menuOpenFor: [],
        renaming: [],
      }),
      state: (state) => ({ visible: state.visible, rows: state.rows }),
      attrs: (state) => ({
        "aria-label": state.label,
        "aria-rowcount": String(state.rows.length),
        "aria-colcount": String(hasMenu(state) ? 2 : 1),
        style: css({ "--kind-thread-list-size": `${state.size}px` }),
      }),
    }),
    heading: slot<RowProps>({
      role: "row",
      props: { value: "string" },
      selects: ownRow(),
      attrs: (state, { props }) => rowAttrs(state, props.value),
    }),
    "heading-cell": slot<RowProps, { label: string }>({
      role: "rowheader",
      props: { value: "string" },
      selects: ownRow(),
      state: (state, { props }) => {
        const entry = state.entries[props.value];
        return { label: entry?.type === "heading" ? entry.label : "" };
      },
      attrs: (state, { props }) => ({
        "aria-colspan": hasMenu(state) ? "2" : undefined,
        "data-group": props.value.slice("heading:".length),
      }),
    }),
    row: slot<RowProps>({
      role: "row",
      props: { value: "string" },
      selects: ownRow(),
      attrs: (state, { props }) => ({
        ...rowAttrs(state, props.value),
        "data-current": state.value === props.value ? "" : undefined,
        "data-menu-open": state.menuOpenFor === props.value ? "" : undefined,
        "data-renaming": state.renaming === props.value ? "" : undefined,
        "data-unread": threadOf(state, props.value)?.unread ? "" : undefined,
      }),
      // Rows mount as the list scrolls, and a web row's parts get their attributes after it's styled.
      bind: (el) => holdTransitions(el),
    }),
    "link-cell": slot<RowProps>({
      role: "gridcell",
      focus: { none: "Its link or More button takes focus." },
      props: { value: "string" },
      selects: ownRow(0),
    }),
    link: slot<RowProps, ThreadListLinkState>({
      props: { value: "string" },
      selects: ownRow(0),
      present: (state, { props }) => state.renaming !== props.value,
      state: (state, { props }) => ({ value: props.value, title: threadOf(state, props.value)?.title ?? "" }),
      attrs: (state, { props, api }) => ({
        href: threadOf(state, props.value)?.href,
        "aria-current": state.value === props.value ? "page" : undefined,
        tabindex: api.grid.tabIndex(state, cellOf(state, props.value, 0)),
      }),
      on: {
        keydown: (event, { api, props }) => api.linkKeydown(event as KeyboardEvent, props.value),
        click: (event, { api, props }) => api.follow(event as MouseEvent, props.value),
        contextmenu: (event, { api, props }) => api.openContextMenu(props.value, event as MouseEvent),
        focus: (_event, { api, props }) => api.focusCell(props.value, 0),
      },
      bind: (el, part) => {
        const unbindCell = part.api.bindCell(el, part, 0);
        const unbindRecovery = part.api.recovery.link.bind(el, part);
        return () => {
          unbindCell();
          unbindRecovery();
        };
      },
    }),
    // The status needs words, so its mark is an image named by it.
    status: slot<RowProps>({
      role: "img",
      props: { value: "string" },
      selects: ownRow(0),
      present: (state, { props }) => threadOf(state, props.value)?.status !== undefined,
      attrs: (state, { props }) => {
        const status = threadOf(state, props.value)?.status;
        return {
          "aria-label": status && STATUS_LABELS[status],
          "data-status-mark": "",
          "data-status": status,
        };
      },
    }),
    unread: slot<RowProps>({
      role: "img",
      props: { value: "string" },
      selects: ownRow(0),
      present: (state, { props }) => threadOf(state, props.value)?.unread === true,
      attrs: () => ({ "aria-label": "Unread" }),
    }),
    editor: slot<RowProps>({
      props: { value: "string" },
      selects: ownRow(0),
      present: (state, { props }) => state.renaming === props.value,
      attrs: (state, { props }) => ({
        "aria-label": `Rename ${threadOf(state, props.value)?.title ?? "chat"}`,
      }),
      on: {
        keydown: (event, { api }) => void api.inlineEdit.inputKeydown(event as KeyboardEvent),
        focusout: (event, { api }) => void api.inlineEdit.end("focus-out", event),
      },
      bind: (el, part) => {
        const unbindInput = part.api.inlineEdit.bindInput(el as HTMLInputElement);
        const unbindRecovery = part.api.recovery.editor.bind(el, part);
        return () => {
          unbindInput();
          unbindRecovery();
        };
      },
    }),
    "more-cell": slot<RowProps>({
      role: "gridcell",
      focus: { none: "Its link or More button takes focus." },
      props: { value: "string" },
      selects: ownRow(1),
      present: hasMenu,
    }),
    // Its own button rather than UI SDK's `MenuTrigger`, which opens on the arrows the grid moves with.
    more: slot<RowProps>({
      role: "button",
      focus: "native",
      props: { value: "string" },
      selects: ownRow(1),
      present: hasMenu,
      press: ({ api, props }, event) => api.openMenu(props.value, event),
      attrs: (state, { props, api }) => ({
        type: "button",
        "aria-label": `More actions for ${threadOf(state, props.value)?.title ?? "chat"}`,
        "aria-haspopup": "menu",
        "aria-expanded": state.menuOpenFor === props.value ? "true" : "false",
        tabindex: api.grid.tabIndex(state, cellOf(state, props.value, 1)),
      }),
      on: {
        keydown: (event, { api }) => void api.grid.keydown(event as KeyboardEvent),
        focus: (_event, { api, props }) => api.focusCell(props.value, 1),
      },
      bind: (el, part) => {
        const unbindCell = part.api.bindCell(el, part, 1);
        const unbindRecovery = part.api.recovery.more.bind(el, part);
        return () => {
          unbindCell();
          unbindRecovery();
        };
      },
    }),
    // Holds UI SDK Menu, whose choices reach `menuBase` (web: through `hearComposed`).
    menu: slot<BaseSlotProps, MenuPartState>({
      selects: outsideRows,
      present: hasMenu,
      state: (state, { api }) => api.menu.partState.menu(state),
      attrs: (state) => ({
        "data-kind": "thread-list",
        "data-menu-part": "root",
        "data-open": state.open ? "" : undefined,
        "data-motion": state.motion,
      }),
      bind: (el, { api }) => hearComposed(el, api.menu.composedEvents),
    }),
    "menu-content": slot<BaseSlotProps, ThreadListMenuContentState>({
      selects: outsideRows,
      state: (state, { api }) => api.menuContentState(state),
      attrs: (state) => ({ "data-menu-part": "content", "data-motion": state.motion }),
    }),
    // Wraps the Alert Dialog, which the primitive opens through its controller.
    dialog: slot<BaseSlotProps, ThreadListDialogState>({
      selects: outsideRows,
      present: (state) => state.canDelete && state.confirmDelete,
      state: (state, { api }) => api.dialogState(state),
      attrs: (state) => ({ "data-motion": state.motion }),
    }),
    // In the dialog's answer row, so a failure moves nothing.
    "dialog-error": slot({ selects: outsideRows, present: (state) => state.deleteFailed }),
    "dialog-cancel": slot({
      role: "button",
      focus: "native",
      selects: outsideRows,
      press: ({ api }, event) => api.cancelDelete(event),
      attrs: (state) => ({ type: "button", "aria-disabled": state.deletePending ? "true" : undefined }),
    }),
    "dialog-delete": slot<BaseSlotProps, { pending: boolean }>({
      role: "button",
      focus: "native",
      selects: outsideRows,
      press: ({ api }, event) => api.confirmDelete(event),
      state: (state) => ({ pending: state.deletePending }),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.deletePending ? "true" : undefined,
        "data-pending": state.deletePending ? "" : undefined,
        // D4: an agent's `delete` opens the dialog, whose Delete needs a person whatever else is allowed.
        "data-agent-confirm": "Deletes the chat",
      }),
    }),
    end: slot<BaseSlotProps, { status: ThreadListState["loadStatus"] }>({
      role: "status",
      state: (state) => ({ status: state.loadStatus }),
      selects: outsideRows,
      present: (state) => state.loadStatus !== "idle",
      attrs: (state) => ({ "data-status": state.loadStatus }),
    }),
    retry: slot({
      role: "button",
      focus: "native",
      selects: outsideRows,
      present: (state) => state.loadStatus === "error" && state.canLoadMore,
      press: ({ api }) => api.retry(),
      attrs: () => ({ type: "button" }),
    }),
  }),
  agent: {
    actions: ["select", "newThread", "rename", "pin", "share", "delete"],
    items: (api) => api.threadItems(),
    closed: true,
  },
});
