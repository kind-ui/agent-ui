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
import { statusGroup, type ThreadGroupOptions, threadGroups } from "../thread-groups.js";
import { threadMark } from "../thread-mark.js";
import { compactTimeLabel, type RelativeTimeOptions, todayKey } from "../time.js";
import { everyMinute } from "../today.js";
import { codeSpans, plainText, WORDS } from "../words.js";

/** `"item-press"`: a person pressed the link or a menu item. `"imperative"`: an `api` call, like an agent's. */
export type ThreadListReason = "item-press" | "imperative";

/** Why `onLoadMore` was called: the list neared its end, or a person pressed Retry. */
export type ThreadListLoadReason = "end-reached" | "retry-press";

/** What a row's menu offers, by value. */
export type ThreadListAction = "rename" | "pin" | "share" | "archive" | "delete";

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
   * Called by Archive, which moves the thread out of the list at once. The host sets its `archived`; a rejection
   * brings it back and announces "<title> was restored".
   */
  onArchive?: (id: string, details: ActionDetails) => unknown;
  /**
   * Called by Unarchive, which takes the time's place in `view: "archived"` and moves the thread out at once. A
   * rejection brings it back, as Archive's does.
   */
  onUnarchive?: (id: string, details: ActionDetails) => unknown;
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
   * Today, as an ISO date or instant, which picks the date groups and how long ago each row reads ("2h", "3d"). Pass
   * it when the server renders the list, so its markup and the browser's agree; without it, server markup shows each
   * row's date and the browser reads its clock.
   * @default todayKey(timeZone)
   */
  now?: string;
  /** A BCP 47 tag for the month, year and relative group names. Defaults to English. */
  locale?: string;
  /** The IANA time zone that decides a thread's day. Defaults to UTC. */
  timeZone?: string;
  /**
   * How the threads group: `"date"` by the host's `group`, then by day; `"status"` by what each run needs from the
   * person, for an inbox of background runs: "Needs you" (waiting on an approval or an answer, or failed and unseen,
   * oldest waiting first), "Running" (newest first, queued last) and "Done" (newest first, folded behind "N more
   * done"). Pinned threads come first either way.
   * @default "date"
   */
  groupBy?: "date" | "status";
  /**
   * Which threads to list: `"active"` leaves archived threads out; `"archived"` lists only them, newest first.
   * @default "active"
   */
  view?: "active" | "archived";
  /** Replaces the fixed groups' words ("Pinned", "Today", "Previous 7 days", "Needs you"), by key. */
  groupLabels?: ThreadGroupOptions["labels"];
};

/**
 * A row of the grid: a group's heading, with its count when grouped by status; a thread; or the row that unfolds
 * "Done", with how many threads it holds back (0 once all show) and whether it has shown any.
 */
export type ThreadListRow =
  | { type: "heading"; key: string; label: string; count?: number | undefined }
  | { type: "thread"; key: string; thread: Thread }
  | { type: "fold"; key: string; count: number; expanded: boolean };

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
  /**
   * How each row's time reads: from the `now` option, else the browser's clock once bound, else no `now`, as on a
   * server; in `locale` and `timeZone`.
   */
  time: RelativeTimeOptions;
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
  /** Whether the delete dialog is open. */
  deleteOpen: boolean;
  canSelect: boolean;
  canNew: boolean;
  canRename: boolean;
  canPin: boolean;
  canShare: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canUnarchive: boolean;
  /** The `groupBy` option. */
  groupBy: "date" | "status";
  /** The `view` option. */
  view: "active" | "archived";
  /** How many pages of "Done" show past its newest thread. */
  donePages: number;
  /** Threads Archive or Unarchive moved out, until the host's threads say so or the call fails. */
  moving: readonly string[];
  /** Grouped by status, with nothing waiting on the person and nothing running. */
  empty: boolean;
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

/** What a row's time hands render functions: how long ago the thread changed, like "2h". */
export type ThreadListTimeState = { label: string };

/** What the link hands render functions: its thread's id and title. */
export type ThreadListLinkState = { value: string; title: string };

/**
 * What a row's second line hands render functions: what it waits on or how it ended when grouped by status
 * ("Approval", "Question", "Failed", "Queued"), and its `summary` split on backticks, odd pieces being code.
 */
export type ThreadListSummaryState = { lead: string; pieces: string[] };

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
  /** Archives a thread through `onArchive`. Offered while it's set, outside `view: "archived"`. */
  readonly archive: ((id: string) => boolean) | undefined;
  /** Unarchives a thread through `onUnarchive`. Offered while it's set, in `view: "archived"`. */
  readonly unarchive: ((id: string) => boolean) | undefined;
  /** Shows the next page of "Done". Offered while it holds threads back. */
  readonly showMoreDone: (() => void) | undefined;
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
  /** Called by the root slot: reads the browser's clock, unless `now` is set, and again each minute. */
  bindClock: () => () => void;
  /** A row's time slot state, memoized per thread. */
  timeState: (state: ThreadListState, id: string) => ThreadListTimeState;
  /** A row's second line, memoized per thread. */
  summaryState: (state: ThreadListState, id: string) => ThreadListSummaryState;
  /** Called by a row: measures it while it has a second line, which may wrap. */
  measureRow: (el: HTMLElement, id: string) => () => void;
  /** Called by the fold button: shows the next page of "Done", or folds it again once all show. */
  toggleDone: (event?: Event) => void;
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
  summary: Slot<RowProps, ThreadListSummaryState>;
  time: Slot<RowProps, ThreadListTimeState>;
  editor: Slot<RowProps>;
  "more-cell": Slot<RowProps>;
  more: Slot<RowProps>;
  unarchive: Slot<RowProps, { label: string }>;
  "fold-row": Slot<RowProps>;
  "fold-cell": Slot<RowProps>;
  fold: Slot<RowProps, { label: string }>;
  empty: Slot<BaseSlotProps, { text: string }>;
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
const NO_IDS: string[] = [];
// The rows' heights before the viewport binds and reads `--kind-thread-row-height` and `-tall`. A row with a second
// line is measured, since it may wrap.
const ROW_HEIGHT = 36;
const TALL_ROW_HEIGHT = 52;
// "Done" shows its newest thread and unread ones, then a page at a time.
const DONE_SHOWN = 1;
const DONE_PAGE = 10;
const FOLD_KEY = "fold:done";
const LEADS: Partial<Record<NonNullable<Thread["status"]>, string>> = {
  "awaiting-approval": "Approval",
  "awaiting-input": "Question",
  error: "Failed",
  queued: WORDS.queued,
};

export type ThreadListRowsOptions = ThreadGroupOptions & {
  /** The `view` option. */
  view?: "active" | "archived" | undefined;
  /** How many pages of "Done" show past its newest thread. */
  donePages?: number | undefined;
};

const newestFirst = (a: Thread, b: Thread) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");

/**
 * The threads as grid rows: each group's heading, then its threads. Grouped by status, "Done" shows its newest and
 * unread threads and `donePages` pages more, then a fold row. `view: "archived"` lists only archived threads, in one
 * "Archived" group.
 */
export const threadListRows = (
  threads: readonly Thread[],
  options: ThreadListRowsOptions,
): ThreadListRow[] => {
  if (options.view === "archived") {
    const archived = threads.filter((thread) => thread.archived).sort(newestFirst);
    if (!archived.length) return [];
    return [
      { type: "heading", key: "heading:archived", label: "Archived" },
      ...archived.map((thread) => ({ type: "thread" as const, key: thread.id, thread })),
    ];
  }
  const status = options.groupBy === "status";
  return threadGroups(
    threads.filter((thread) => !thread.archived),
    options,
  ).flatMap((group): ThreadListRow[] => {
    const heading: ThreadListRow = {
      type: "heading",
      key: `heading:${group.key}`,
      label: group.label,
      count: status ? group.threads.length : undefined,
    };
    let shown = group.threads;
    let fold: ThreadListRow[] = [];
    if (status && group.key === "done" && group.threads.length > DONE_SHOWN) {
      const limit = DONE_SHOWN + (options.donePages ?? 0) * DONE_PAGE;
      shown = group.threads.filter((thread, index) => index < limit || thread.unread);
      fold = [
        {
          type: "fold",
          key: FOLD_KEY,
          count: group.threads.length - shown.length,
          expanded: (options.donePages ?? 0) > 0,
        },
      ];
    }
    return [
      heading,
      ...shown.map((thread) => ({ type: "thread" as const, key: thread.id, thread })),
      ...fold,
    ];
  });
};

/** A thread's second line, from its status when grouped by status, and its `summary`. */
const summaryOf = (
  thread: Thread | undefined,
  groupBy: ThreadListState["groupBy"],
): ThreadListSummaryState => ({
  lead: (groupBy === "status" && thread?.status && LEADS[thread.status]) || "",
  pieces: thread?.summary ? codeSpans(thread.summary) : [],
});

const hasSummary = (thread: Thread | undefined, groupBy: ThreadListState["groupBy"]) => {
  const { lead, pieces } = summaryOf(thread, groupBy);
  return !!lead || pieces.length > 0;
};

const isTall = (row: ThreadListRow | undefined, groupBy: ThreadListState["groupBy"]) =>
  row?.type === "thread" && hasSummary(row.thread, groupBy);

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
        ? before.type === "heading" && before.label === row.label && before.count === row.count
        : row.type === "fold"
          ? before.type === "fold" && before.count === row.count && before.expanded === row.expanded
          : before.type === "thread" && before.thread === row.thread);
    entries[row.key] = same ? before : { ...row, index };
  });
  return entries;
};

const heightOf = (row: ThreadListRow | undefined, groupBy: ThreadListState["groupBy"]) =>
  isTall(row, groupBy) ? TALL_ROW_HEIGHT : ROW_HEIGHT;

// The first screenful of rows, before the viewport binds and the virtualizer measures, so server markup shows them.
const firstVisible = (rows: readonly ThreadListRow[], groupBy: ThreadListState["groupBy"]): VirtualItem[] => {
  let start = 0;
  return rows.slice(0, 20).map((row, index) => {
    const size = heightOf(row, groupBy);
    const item = { index, key: row.key, start, size };
    start += size;
    return item;
  });
};

const sizeOf = (rows: readonly ThreadListRow[], groupBy: ThreadListState["groupBy"]) =>
  rows.reduce((size, row) => size + heightOf(row, groupBy), 0);

/** Grouped by status, whether nothing waits on the person and nothing runs. */
const isEmpty = (threads: readonly Thread[], options: ThreadListOptions) =>
  options.groupBy === "status" &&
  options.view !== "archived" &&
  !threads.some((thread) => !thread.archived && statusGroup(thread) !== "done");

const startsOf = (visible: readonly VirtualItem[]) =>
  Object.fromEntries(visible.map((item) => [item.key, item.start]));

const can = (options: ThreadListOptions) => ({
  canSelect: options.onSelect !== undefined,
  canNew: options.onNew !== undefined,
  canRename: options.onRename !== undefined,
  canPin: options.onPinChange !== undefined,
  canShare: options.onShare !== undefined,
  canDelete: options.onDelete !== undefined,
  canArchive: options.onArchive !== undefined && options.view !== "archived",
  canUnarchive: options.onUnarchive !== undefined && options.view === "archived",
});

type Abilities = Pick<ThreadListState, "canRename" | "canPin" | "canShare" | "canArchive" | "canDelete">;

const menuActions = (abilities: Abilities, pinned: boolean) => [
  ...(abilities.canRename ? [{ value: "rename" as const, label: "Rename" }] : []),
  ...(abilities.canPin ? [{ value: "pin" as const, label: pinned ? "Unpin" : "Pin" }] : []),
  ...(abilities.canShare ? [{ value: "share" as const, label: "Share" }] : []),
  ...(abilities.canArchive ? [{ value: "archive" as const, label: "Archive" }] : []),
  ...(abilities.canDelete ? [{ value: "delete" as const, label: "Delete" }] : []),
];

// The archived view offers Unarchive in More's place, and no menu.
const hasMenu = (state: Abilities & Pick<ThreadListState, "view">) =>
  state.view !== "archived" &&
  (state.canRename || state.canPin || state.canShare || state.canArchive || state.canDelete);

const hasSecondCell = (state: ThreadListState) => hasMenu(state) || state.canUnarchive;

// One array per set of actions, since `menuBase` asks for one array per input.
const menuData = new Map<string, MenuData>();
const toData = (options: ThreadListOptions): MenuData => {
  const actions = options.view === "archived" ? [] : menuActions(can(options), false);
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
  canOpen: (options) => hasMenu({ ...can(options), view: options.view ?? "active" }),
  onAction: (value, { event, source }, context) => actionsByContext.get(context)?.(value, source, event),
});

const groupOptions = (options: ThreadListOptions): ThreadGroupOptions => ({
  now: options.now ?? todayKey(options.timeZone),
  locale: options.locale,
  timeZone: options.timeZone,
  labels: options.groupLabels,
  groupBy: options.groupBy,
});

// Reads `options` rather than spreading it: on Web Components, `@ui-sdk/web` fills in the callbacks on read.
const presentation = (options: ThreadListOptions) => ({
  ...can(options),
  confirmDelete: options.confirmDelete ?? true,
  hasMore: options.hasMore ?? false,
  loadStatus: options.status ?? "idle",
  canLoadMore: options.onLoadMore !== undefined,
  groupBy: options.groupBy ?? "date",
  view: options.view ?? "active",
});

const threadOf = (state: ThreadListState, id: string | null) => {
  const entry = id === null ? undefined : state.entries[id];
  return entry?.type === "thread" ? entry.thread : undefined;
};

const byValue = ({ props }: { props: Cell }) => [props.value];

// A row's parts hear only about their own entry, place and marks, so a change reaches only the rows it changed.
const ownRow = (column?: number) =>
  selects<ThreadListState, ThreadListApi, RowProps>({
    time: [],
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
    deleteOpen: [],
    donePages: [],
    moving: [],
    empty: [],
  });

const threadIn = (entry: ThreadListEntry | undefined) =>
  entry?.type === "thread" ? entry.thread : undefined;

// A row's time hears only about its own thread and the clock, not about the row moving.
const ownTime = selects<ThreadListState, ThreadListApi, RowProps>({
  rows: [],
  entries: {
    values: byValue,
    moved: (before, after, notify) => {
      for (const id in after) if (threadIn(before[id]) !== threadIn(after[id])) notify(id);
      for (const id in before) if (!(id in after)) notify(id);
    },
  },
  visible: [],
  starts: [],
  size: [],
  active: [],
  focused: [],
  value: [],
  menuFor: [],
  menuOpenFor: [],
  renaming: [],
  open: [],
  renamePending: [],
  deleting: [],
  deletePending: [],
  deleteFailed: [],
  deleteOpen: [],
  donePages: [],
  moving: [],
  empty: [],
});

const outsideRows = selects<ThreadListState, ThreadListApi, BaseSlotProps>({
  time: [],
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
  donePages: [],
  moving: [],
});

const rowAttrs = (state: ThreadListState, value: string) => {
  const start = state.starts[value];
  return {
    "aria-rowindex": String((state.entries[value]?.index ?? 0) + 1),
    style: css({ "--kind-thread-row-start": start === undefined ? undefined : `${start}px` }),
  };
};

const markOf = (state: ThreadListState, id: string) => {
  const thread = threadOf(state, id);
  return thread && threadMark(thread, { unreadOnly: state.groupBy === "status" });
};

// A thread id may hold spaces, which `aria-describedby` reads as a list.
const timeId = (id: string, value: string) => `${id}-time-${encodeURIComponent(value)}`;

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
    onArchive: "action",
    onUnarchive: "action",
    onDelete: "action",
    confirmDelete: "boolean",
    hasMore: "boolean",
    onLoadMore: "callback",
    status: "string",
    now: "string",
    locale: "string",
    timeZone: "string",
    groupBy: "string",
    view: "string",
    groupLabels: "value",
  },
  state: (options) => {
    const threads = options.threads ?? NO_THREADS;
    const groupBy = options.groupBy ?? "date";
    const rows = threadListRows(threads, { ...groupOptions(options), view: options.view });
    const visible = firstVisible(rows, groupBy);
    return {
      ...base.state(options),
      ...presentation(options),
      value: options.value ?? null,
      time: { now: options.now, locale: options.locale, timeZone: options.timeZone },
      rows,
      entries: entriesOf(rows, {}),
      visible,
      starts: startsOf(visible),
      size: sizeOf(rows, groupBy),
      donePages: 0,
      moving: NO_IDS,
      empty: isEmpty(threads, options),
      active: null,
      focused: null,
      menuFor: null,
      menuOpenFor: null,
      renaming: null,
      renamePending: false,
      deleting: null,
      deletePending: false,
      deleteFailed: false,
      deleteOpen: false,
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
    let tallHeight = TALL_ROW_HEIGHT;
    let clock: string | undefined;
    // Each row's time by thread id, with what it was read from.
    const times = new Map<
      string,
      { state: ThreadListTimeState; from: string | undefined; time: RelativeTimeOptions }
    >();
    const readTime = ({ now = clock, locale, timeZone }: ThreadListOptions) => {
      const { time } = store.get();
      if (time.now !== now || time.locale !== locale || time.timeZone !== timeZone)
        store.set({ time: { now, locale, timeZone } });
    };
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
        groupBy: ThreadGroupOptions["groupBy"],
        view: ThreadListOptions["view"],
        donePages: number,
        moving: readonly string[],
      ) =>
        threadListRows(moving.length ? threads.filter((thread) => !moving.includes(thread.id)) : threads, {
          now,
          locale,
          timeZone,
          labels,
          groupBy,
          view,
          donePages,
        }),
    );
    // Each row's second line by thread id, with what it was read from.
    const summaries = new Map<
      string,
      { state: ThreadListSummaryState; from: Thread | undefined; groupBy: ThreadListState["groupBy"] }
    >();

    const cols = () => (hasSecondCell(store.get()) ? 2 : 1);
    const keyAt = (row: number) => store.get().rows[row]?.key;
    const isThread = (row: number) => store.get().rows[row]?.type === "thread";
    const isFold = (row: number) => store.get().rows[row]?.type === "fold";

    const virtual = createVirtualizer({
      count: () => store.get().rows.length,
      estimate: (index) => (isTall(store.get().rows[index], store.get().groupBy) ? tallHeight : rowHeight),
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
      pageSize: () => Math.max(1, Math.floor((viewport?.clientHeight ?? 0) / tallHeight)),
      // The fold row has its button and nothing beside it.
      disabled: (cell) => !isThread(cell.row) && !(isFold(cell.row) && cell.col === 0),
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

    const showRows = (options = context.options()) => {
      const { rows: before, entries, groupBy, donePages } = store.get();
      let { moving } = store.get();
      const threads = options.threads ?? NO_THREADS;
      // A thread Archive or Unarchive moved out stays out until the host's threads agree, or it's gone.
      if (moving.length) {
        const archived = options.view === "archived";
        const settled = moving.filter((id) => {
          const thread = threads.find((each) => each.id === id);
          return thread !== undefined && !!thread.archived === archived;
        });
        if (settled.length !== moving.length) {
          moving = settled.length ? settled : NO_IDS;
          store.set({ moving });
        }
      }
      const { now, locale, timeZone, labels } = groupOptions(options);
      const rows = rowsOf(
        threads,
        now,
        locale,
        timeZone,
        labels,
        options.groupBy,
        options.view,
        donePages,
        moving,
      );
      const empty = isEmpty(
        moving.length ? threads.filter((thread) => !moving.includes(thread.id)) : threads,
        options,
      );
      if (empty !== store.get().empty) store.set({ empty });
      if (rows.length !== before.length) atEnd = false;
      loadAtEnd(options);
      if (rows === before) return;
      lastIndex = new Map(before.map((row, index) => [row.key, index]));
      store.set({ rows, entries: entriesOf(rows, entries) });
      settleActive();
      if (viewport) virtual.refresh();
      else {
        const visible = firstVisible(rows, groupBy);
        store.set({ visible, starts: startsOf(visible), size: sizeOf(rows, groupBy) });
      }
    };

    // `value` reaches state here rather than through `sync`, since a synced key that changes renders every React part.
    context.onOptions((options) => {
      const value = options.value ?? null;
      if (value !== store.get().value) store.set({ value });
      readTime(options);
      showRows(options);
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
    let opens = 0;
    const requestDelete = (id: string, source: ChangeSource) => {
      if (store.get().deletePending) return;
      if (!store.get().confirmDelete) return runDelete(id, source);
      store.set({ deleting: id, deleteFailed: false, deleteOpen: true });
      // `open` resolves on the dialog's next close (undefined before a dialog attaches the controller). Only the
      // latest open clears the mark.
      const open = ++opens;
      const closed = dialog.open() as ReturnType<typeof dialog.open> | undefined;
      void Promise.resolve(closed).then(() => {
        if (open === opens) store.set({ deleteOpen: false });
      });
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

    // Moves the thread out at once; a rejection brings it back and says so.
    const move = (id: string, callback: "onArchive" | "onUnarchive", source: ChangeSource) => {
      const run = context.options()[callback];
      const thread = threadOf(store.get(), id);
      if (!run || !thread) return false;
      store.set({ moving: [...store.get().moving, id] });
      showRows();
      let result: unknown;
      try {
        result = run(id, { source });
      } catch (error) {
        result = Promise.reject(error);
      }
      void Promise.resolve(result).catch(() => {
        const { moving } = store.get();
        if (!moving.includes(id)) return;
        const rest = moving.filter((each) => each !== id);
        store.set({ moving: rest.length ? rest : NO_IDS });
        showRows();
        announce(`${plainText(thread.title)} ${WORDS.wasRestored}`, { priority: "polite" });
      });
      return true;
    };

    const toggleDone = () => {
      const fold = store.get().entries[FOLD_KEY];
      if (fold?.type !== "fold") return;
      store.set({ donePages: fold.count > 0 ? store.get().donePages + 1 : 0 });
      showRows();
    };

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
      else if (action === "archive") move(id, "onArchive", source);
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
      (
        canRename: boolean,
        canPin: boolean,
        canShare: boolean,
        canArchive: boolean,
        canDelete: boolean,
      ): Abilities => ({ canRename, canPin, canShare, canArchive, canDelete }),
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
      get archive() {
        return store.get().canArchive
          ? (id: string) => move(id, "onArchive", actionSource(undefined, "imperative"))
          : undefined;
      },
      get unarchive() {
        return store.get().canUnarchive
          ? (id: string) => move(id, "onUnarchive", actionSource(undefined, "imperative"))
          : undefined;
      },
      get showMoreDone() {
        const fold = store.get().entries[FOLD_KEY];
        return fold?.type === "fold" && fold.count > 0 ? toggleDone : undefined;
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
      bindClock: () => {
        const tick = () => {
          clock = new Date().toISOString();
          readTime(context.options());
        };
        tick();
        const stop = everyMinute(tick);
        return () => {
          stop();
          clock = undefined;
        };
      },
      timeState: (state, id) => {
        const thread = threadOf(state, id);
        // Grouped by status, a thread waiting on the person reads how long it has waited.
        const status = state.groupBy === "status";
        const from =
          status && thread && statusGroup(thread) === "needs-you"
            ? (thread.waitingSince ?? thread.updatedAt)
            : thread?.updatedAt;
        const found = times.get(id);
        if (found && found.from === from && found.time === state.time) return found.state;
        const next = {
          state: {
            label:
              from === undefined
                ? ""
                : compactTimeLabel(from, { ...state.time, width: status ? "short" : "narrow" }),
          },
          from,
          time: state.time,
        };
        times.set(id, next);
        return next.state;
      },
      summaryState: (state, id) => {
        const thread = threadOf(state, id);
        const found = summaries.get(id);
        if (found && found.from === thread && found.groupBy === state.groupBy) return found.state;
        const next = { state: summaryOf(thread, state.groupBy), from: thread, groupBy: state.groupBy };
        summaries.set(id, next);
        return next.state;
      },
      // A search of rows by id, as Transcript's segments: a row's index changes while its element stays.
      measureRow: (el, id) => {
        let index: number | undefined;
        let unmeasure: (() => void) | undefined;
        const follow = () => {
          const { entries, groupBy } = store.get();
          const entry = entries[id];
          const next = entry && isTall(entry, groupBy) ? entry.index : undefined;
          if (next === index) return;
          unmeasure?.();
          index = next;
          unmeasure = index === undefined ? undefined : virtual.measure(index, el);
        };
        follow();
        const unsubscribe = store.subscribe(follow);
        return () => {
          unsubscribe();
          unmeasure?.();
        };
      },
      toggleDone,
      bindViewport: (el) => {
        viewport = el;
        const style = getComputedStyle(el);
        rowHeight = Number.parseFloat(style.getPropertyValue("--kind-thread-row-height")) || ROW_HEIGHT;
        tallHeight =
          Number.parseFloat(style.getPropertyValue("--kind-thread-row-height-tall")) || TALL_ROW_HEIGHT;
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
          abilities(state.canRename, state.canPin, state.canShare, state.canArchive, state.canDelete),
        ),
      dialogState: (state) =>
        dialogState(!state.deletePending, state.deleting, threadOf(state, state.deleting)),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "navigation",
      selects: outsideRows,
      attrs: (state) => ({
        "aria-label": state.label,
        "data-motion": state.motion,
        "data-group-by": state.groupBy,
        "data-view": state.view,
      }),
      bind: (_el, { api }) => api.bindClock(),
    }),
    new: slot({
      role: "button",
      focus: "native",
      selects: outsideRows,
      present: (state) => state.canNew,
      press: ({ api }, event) => api.newThread?.(event),
      attrs: () => ({ type: "button", "data-kind-button": "", "data-kind-size": "lg" }),
    }),
    viewport: slot({
      selects: outsideRows,
      bind: (el, { api }) => api.bindViewport(el),
    }),
    grid: slot<BaseSlotProps, ThreadListGridState>({
      role: "grid",
      keys: { none: "The links and More buttons in its cells handle them." },
      selects: selects<ThreadListState, ThreadListApi, BaseSlotProps>({
        time: [],
        entries: [],
        starts: [],
        active: [],
        focused: [],
        value: [],
        menuOpenFor: [],
        renaming: [],
        deleteOpen: [],
      }),
      state: (state) => ({ visible: state.visible, rows: state.rows }),
      attrs: (state) => ({
        "aria-label": state.label,
        "aria-rowcount": String(state.rows.length),
        "aria-colcount": String(hasSecondCell(state) ? 2 : 1),
        style: css({ "--kind-thread-list-size": `${state.size}px` }),
      }),
    }),
    heading: slot<RowProps>({
      role: "row",
      props: { value: "string" },
      selects: ownRow(),
      attrs: (state, { props }) => rowAttrs(state, props.value),
    }),
    "heading-cell": slot<RowProps, { label: string; count: string }>({
      role: "rowheader",
      props: { value: "string" },
      selects: ownRow(),
      state: (state, { props }) => {
        const entry = state.entries[props.value];
        if (entry?.type !== "heading") return { label: "", count: "" };
        return { label: entry.label, count: entry.count === undefined ? "" : String(entry.count) };
      },
      attrs: (state, { props }) => ({
        "aria-colspan": hasSecondCell(state) ? "2" : undefined,
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
        "data-tall": isTall(state.entries[props.value], state.groupBy) ? "" : undefined,
      }),
      // Rows mount as the list scrolls, and a web row's parts get their attributes after it's styled.
      bind: (el, { api, props }) => {
        const release = holdTransitions(el);
        const unmeasure = api.measureRow(el, props.value);
        return () => {
          release();
          unmeasure();
        };
      },
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
      attrs: (state, { props, api, id }) => ({
        href: threadOf(state, props.value)?.href,
        "aria-current": state.value === props.value ? "page" : undefined,
        // Grouped by status, the time is how long it has waited or run, which joins the row's name.
        "aria-describedby": state.groupBy === "status" ? timeId(id, props.value) : undefined,
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
    // One mark per row, the most urgent; the status needs words, so the mark is an image named by it.
    status: slot<RowProps>({
      role: "img",
      props: { value: "string" },
      selects: ownRow(0),
      present: (state, { props }) => markOf(state, props.value) !== undefined,
      attrs: (state, { props }) => {
        const mark = markOf(state, props.value);
        const unread = threadOf(state, props.value)?.unread && mark?.status !== "complete";
        return {
          "aria-label": mark && (unread ? `${mark.label}, unread` : mark.label),
          "data-status-mark": "",
          "data-status": mark?.status,
        };
      },
    }),
    // Only when no status mark shows, so a row holds one mark.
    unread: slot<RowProps>({
      role: "img",
      props: { value: "string" },
      selects: ownRow(0),
      present: (state, { props }) =>
        threadOf(state, props.value)?.unread === true && markOf(state, props.value) === undefined,
      attrs: () => ({ "aria-label": "Unread" }),
    }),
    // Under the title: what the run waits on or how it ended, then its summary. In the link, so it joins its name.
    summary: slot<RowProps, ThreadListSummaryState>({
      props: { value: "string" },
      selects: ownRow(0),
      present: (state, { props }) => hasSummary(threadOf(state, props.value), state.groupBy),
      state: (state, { api, props }) => api.summaryState(state, props.value),
    }),
    // Hidden from assistive technology: the row's date group says when, and the link's name stays its title. Grouped
    // by status, the link takes it as its description.
    time: slot<RowProps, ThreadListTimeState>({
      props: { value: "string" },
      selects: ownTime,
      state: (state, { api, props }) => api.timeState(state, props.value),
      attrs: (_state, { props, id }) => ({ id: timeId(id, props.value), "aria-hidden": "true" }),
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
      present: hasSecondCell,
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
    // In More's place in `view: "archived"`, over the time, as More is.
    unarchive: slot<RowProps, { label: string }>({
      role: "button",
      focus: "native",
      props: { value: "string" },
      selects: ownRow(1),
      present: (state) => state.canUnarchive,
      press: ({ api, props }) => void api.unarchive?.(props.value),
      state: () => ({ label: WORDS.unarchive }),
      attrs: (state, { props, api }) => ({
        type: "button",
        "aria-label": `${WORDS.unarchive} ${threadOf(state, props.value)?.title ?? "chat"}`,
        "data-kind-button": "",
        "data-kind-size": "sm",
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
    // The row after "Done"'s threads that shows a page more, then folds them again (Wave 7 spec §13).
    "fold-row": slot<RowProps>({
      role: "row",
      props: { value: "string" },
      selects: ownRow(),
      attrs: (state, { props }) => rowAttrs(state, props.value),
    }),
    "fold-cell": slot<RowProps>({
      role: "gridcell",
      focus: { none: "Its button takes focus." },
      props: { value: "string" },
      selects: ownRow(0),
      attrs: (state) => ({ "aria-colspan": hasSecondCell(state) ? "2" : undefined }),
    }),
    fold: slot<RowProps, { label: string }>({
      role: "button",
      focus: "native",
      props: { value: "string" },
      selects: ownRow(0),
      press: ({ api }, event) => api.toggleDone(event),
      state: (state, { props }) => {
        const entry = state.entries[props.value];
        const count = entry?.type === "fold" ? entry.count : 0;
        return { label: count > 0 ? `${count} ${WORDS.moreDone}` : "Show less" };
      },
      attrs: (state, { props, api }) => {
        const entry = state.entries[props.value];
        return {
          type: "button",
          "aria-expanded": entry?.type === "fold" && entry.expanded ? "true" : "false",
          tabindex: api.grid.tabIndex(state, cellOf(state, props.value, 0)),
        };
      },
      on: {
        keydown: (event, { api }) => void api.grid.keydown(event as KeyboardEvent),
        focus: (_event, { api, props }) => api.focusCell(props.value, 0),
      },
      bind: (el, part) => part.api.bindCell(el, part, 0),
    }),
    // Grouped by status, above the rows when nothing waits on the person and nothing runs.
    empty: slot<BaseSlotProps, { text: string }>({
      present: (state) => state.empty,
      state: () => ({ text: WORDS.nothingWaiting }),
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
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.deletePending ? "true" : undefined,
        "data-kind-button": "secondary",
      }),
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
        "data-kind-button": "danger",
        // D4: an agent's `delete` opens the dialog, whose Delete needs a person whatever else is allowed. Only while
        // open: a web part that stays in the page closed would otherwise mark every step on the list.
        "data-agent-confirm": state.deleteOpen ? "Deletes the chat" : undefined,
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
      attrs: () => ({ type: "button", "data-kind-button": "", "data-kind-size": "sm" }),
    }),
  }),
  agent: {
    actions: [
      "select",
      "newThread",
      "rename",
      "pin",
      "share",
      "archive",
      "unarchive",
      "showMoreDone",
      "delete",
    ],
    items: (api) => api.threadItems(),
    closed: true,
  },
});
