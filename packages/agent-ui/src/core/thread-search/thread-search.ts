import {
  type ChangeDetails,
  dispatch,
  type PopupPartState,
  popupBackdrop,
  type SlotDefinition,
  toLocale,
} from "@ui-sdk/core";
import { formatDate } from "@ui-sdk/core/date";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { ariaKeyshortcuts, formatShortcut, registerShortcut } from "@ui-sdk/core/shortcuts";
import { fuzzyScore, matchRanges } from "@ui-sdk/core/text-match";
import type { PickerAction, PickerItem, Thread } from "../../types/index.js";
import { definePrimitive } from "../define-primitive.js";
import {
  type PickerBaseApi,
  type PickerBaseOptions,
  type PickerBaseSlots,
  type PickerBaseState,
  type PickerSearchOptions,
  type PickerValueChangeReason,
  pickerBase,
} from "../picker/base.js";
import { threadGroups } from "../thread-groups.js";
import { type DateGroupKey, dateGroup, dayKey, todayKey } from "../time.js";

/** `"item-press"`: a person chose a row. `"imperative"`: an `api` call, like an agent's `select` or `newThread`. */
export type ThreadSearchSelectReason = PickerValueChangeReason;

/** Thread Search's options: Picker's, less the value and footer actions, with its search and the threads. */
export type ThreadSearchOptions = Omit<
  PickerBaseOptions,
  | "actions"
  | "onAction"
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "backLabel"
  | "label"
  | "placeholder"
  | "emptyText"
> &
  PickerSearchOptions & {
    /**
     * The threads to search. While the search is empty the newest 20 show; while it filters, every one does, grouped
     * as Thread List groups them: pinned first, then each `group`, then by date from `updatedAt`, the groups and rows
     * holding the search's text best first.
     * @default []
     */
    threads?: Thread[];
    /** Called when a person or `select` chooses a thread, by its `id`. Cancel it to keep the dialog open. */
    onSelect?: (id: string, details: ChangeDetails<ThreadSearchSelectReason>) => void;
    /**
     * Adds a "New chat" row after the threads, which shows whatever the search and names it (`New chat: “text”`),
     * called with the search text when a person or `newThread` runs it.
     */
    onNew?: (query: string, details: ChangeDetails<ThreadSearchSelectReason>) => void;
    /**
     * Names the "New chat" row.
     * @default "New chat"
     */
    newLabel?: string;
    /**
     * Names the trigger, the dialog and the search field.
     * @default "Search chats"
     */
    label?: string;
    /**
     * Shown in the empty search field.
     * @default "Search chats…"
     */
    placeholder?: string;
    /**
     * Shown while no thread matches the search.
     * @default "No chats found"
     */
    emptyText?: string;
    /** Keys that open the dialog from anywhere on the page, like `"mod+k"`, shown in the trigger. None by default. */
    shortcut?: string;
    /** Today, for the date groups: an ISO date or an instant. Defaults to today in `timeZone`. */
    now?: string;
    /** A BCP 47 tag for the date groups' words. Defaults to English. */
    locale?: string;
    /** The IANA time zone that decides a thread's day. Defaults to UTC. */
    timeZone?: string;
    /** Replaces the fixed groups' words ("Pinned", "Previous 7 days", …), by key. */
    groupLabels?: Partial<Record<DateGroupKey | "pinned", string>>;
  };

/** Picker's state, with the `shortcut` and how this platform shows it. */
export type ThreadSearchState = PickerBaseState & {
  /** The `shortcut` option. */
  shortcut: string | undefined;
  /** The `shortcut` as this platform shows it, like `⌘K`. Empty until the root binds, so a server renders none. */
  shortcutText: string;
  /** The `shortcut` for `aria-keyshortcuts`. Unset until the root binds. */
  keyshortcuts: string | undefined;
};

/** What a row's `icon` holds: the thread's status and its words, for a status mark. */
export type ThreadSearchIcon = { status: NonNullable<Thread["status"]>; label: string };

/** Picker's api, where `select` chooses a thread and `search` types into the field, with `newThread`. */
export type ThreadSearchApi = PickerBaseApi & {
  /** Runs "New chat" with the search text, calling `onNew`. Offered only while `onNew` is set. */
  readonly newThread: (() => boolean) | undefined;
  /** Every thread, for agents, without the "New chat" row. */
  getThreads: () => { value: string; label: string; disabled?: boolean }[];
};

type ThreadSearchSlots = PickerBaseSlots<ThreadSearchState, ThreadSearchApi> & {
  backdrop: SlotDefinition<ThreadSearchState, ThreadSearchApi, BaseSlotProps, PopupPartState>;
  shortcut: SlotDefinition<ThreadSearchState, ThreadSearchApi, BaseSlotProps, { text: string }>;
  hints: SlotDefinition<ThreadSearchState, ThreadSearchApi, BaseSlotProps>;
  status: SlotDefinition<ThreadSearchState, ThreadSearchApi, BaseSlotProps & { value?: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ThreadSearchPrimitive = ReturnType<
  typeof definePrimitive<ThreadSearchOptions, ThreadSearchState, ThreadSearchApi, ThreadSearchSlots>
>;

const RECENT = 20;
const NEW = "new";
const noThreads: Thread[] = [];

const STATUS: Record<ThreadSearchIcon["status"], string> = {
  running: "Running",
  "awaiting-input": "Needs input",
  error: "Failed",
};

type Grouping = {
  now: string;
  locale: string | undefined;
  timeZone: string | undefined;
  groupLabels: ThreadSearchOptions["groupLabels"] | undefined;
};

const groupingOf = ({ now, locale, timeZone, groupLabels }: ThreadSearchOptions): Grouping => ({
  now: now ?? todayKey(timeZone),
  locale,
  timeZone,
  groupLabels,
});

const itemOf = (
  thread: Thread,
  group: string | undefined,
  meta: string | undefined,
): PickerItem<unknown> => ({
  value: thread.id,
  label: thread.title,
  ...(thread.snippet ? { description: thread.snippet } : {}),
  ...(meta ? { meta } : {}),
  ...(group === undefined ? {} : { group }),
  ...(thread.status ? { icon: { status: thread.status, label: STATUS[thread.status] } } : {}),
});

const dateOf = (thread: Thread, grouping: Grouping) =>
  dateGroup(thread.updatedAt, { ...grouping, labels: grouping.groupLabels }).label;

/** "Nov 2", with the year when it isn't `now`'s. */
const shortDate = (thread: Thread, grouping: Grouping) => {
  const day = thread.updatedAt ? dayKey(thread.updatedAt, grouping.timeZone) : undefined;
  if (!day) return undefined;
  const thisYear = dayKey(grouping.now, grouping.timeZone)?.slice(0, 4) === day.slice(0, 4);
  return formatDate(day, toLocale(grouping.locale ?? "en") ?? "en", {
    month: "short",
    day: "numeric",
    ...(thisYear ? {} : { year: "numeric" as const }),
  });
};

/** Grouped as Thread List groups them; a row under a date group needs no date of its own. */
const groupedItems = (threads: readonly Thread[], grouping: Grouping) =>
  threadGroups(threads, { ...grouping, labels: grouping.groupLabels }).flatMap((group) =>
    group.threads.map((thread) =>
      itemOf(
        thread,
        group.label,
        group.key === "pinned" || group.key.startsWith("group:") ? shortDate(thread, grouping) : undefined,
      ),
    ),
  );

/** In the host's order and ungrouped, so pinning and dates show in each row's `meta`. */
const hostItems = (threads: readonly Thread[], grouping: Grouping) =>
  threads.map((thread) =>
    itemOf(
      thread,
      undefined,
      thread.pinned ? (grouping.groupLabels?.pinned ?? "Pinned") : dateOf(thread, grouping),
    ),
  );

const time = (thread: Thread) => {
  const at = thread.updatedAt ? Date.parse(thread.updatedAt) : Number.NaN;
  return Number.isNaN(at) ? Number.NEGATIVE_INFINITY : at;
};

const newest = (threads: readonly Thread[]) =>
  [...threads].sort((a, b) => time(b) - time(a)).slice(0, RECENT);

// Rows are kept while the host keeps its `threads` array and what they're grouped by, per array, so instances side by
// side don't evict each other's.
type Rows = { key: string; items: PickerItem<unknown>[]; recent: PickerItem<unknown>[] | undefined };
const cache = new WeakMap<Thread[], Rows>();

const rows = (options: ThreadSearchOptions): Rows => {
  const threads = options.threads ?? noThreads;
  const grouping = groupingOf(options);
  const filter = options.filter !== false;
  const key = JSON.stringify([grouping, filter]);
  const found = cache.get(threads);
  if (found?.key === key) return found;
  const made: Rows = filter
    ? {
        key,
        items: groupedItems(threads, grouping),
        recent: threads.length > RECENT ? groupedItems(newest(threads), grouping) : undefined,
      }
    : { key, items: hostItems(threads, grouping), recent: undefined };
  cache.set(threads, made);
  return made;
};

// How well a row holds the search as Command keeps it, as typed: 0 when it doesn't, else `fuzzyScore`'s, the title a
// little ahead of the snippet.
const score = (item: PickerItem<unknown>, query: string) =>
  [item.label, item.description ?? ""].reduce(
    (best, text, index) =>
      matchRanges(text, query, "contains").length
        ? Math.max(best, fuzzyScore(text, query) * (index ? 0.95 : 1))
        : best,
    0,
  );

/** The best matches first, so each group sits where its best row does, and "New chat" names the search. */
const rank = (items: PickerItem<unknown>[], actions: PickerAction<unknown>[], query: string) => {
  const scored = items.map((item) => ({ item, score: score(item, query) }));
  return {
    items: scored.sort((a, b) => b.score - a.score).map(({ item }) => item),
    actions: actions.map((action) => ({ ...action, label: `${action.label}: “${query}”` })),
    matched: scored[0] !== undefined && scored[0].score > 0,
  };
};

// One array per label: a layer that runs `sync` on every store write (Solid) compares it by identity, and a new array
// each time made opening the dialog update forever.
const newActions = new Map<string, PickerAction<unknown>[]>();
const newAction = (label: string) => {
  const actions = newActions.get(label) ?? [{ id: NEW, label }];
  newActions.set(label, actions);
  return actions;
};

const base = pickerBase<ThreadSearchOptions>({
  kind: "thread-search",
  label: "Search chats",
  placeholder: "Search chats…",
  emptyText: "No chats found",
  popup: "dialog",
  sharedTrigger: true,
  select: true,
  search: true,
  rank,
  toItems: (options) => rows(options).items,
  emptyItems: (options) => rows(options).recent,
  actions: {
    of: (options) => (typeof options.onNew === "function" ? newAction(options.newLabel ?? "New chat") : []),
    run: (context, _id, details) => dispatch(context, "onNew", context.store.get().query, details),
  },
});

const shortcutOf = (options: ThreadSearchOptions) => ({ shortcut: options.shortcut || undefined });

/**
 * The "Search chats" dialog: a button that opens a search over the threads, grouped as Thread List groups them, with
 * "New chat" after them. Built on Picker's rows in a dialog: choosing a thread calls `onSelect` and closes it. With
 * `filter: false` the host searches, and `status` says when its results are loading or failed.
 */
export const threadSearchPrimitive: ThreadSearchPrimitive = definePrimitive<
  ThreadSearchOptions,
  ThreadSearchState,
  ThreadSearchApi,
  ThreadSearchSlots
>({
  name: "kind-thread-search",
  options: {
    open: base.options.open,
    defaultOpen: base.options.defaultOpen,
    onOpenChange: base.options.onOpenChange,
    presentation: base.options.presentation,
    disabled: base.options.disabled,
    motion: base.options.motion,
    label: "string",
    placeholder: "string",
    emptyText: "string",
    threads: "value",
    query: "string",
    defaultQuery: "string",
    onQueryChange: "callback",
    filter: "boolean",
    status: "string",
    loadingText: "string",
    errorText: "string",
    onSelect: "callback",
    onNew: "callback",
    newLabel: "string",
    shortcut: "string",
    now: "string",
    locale: "string",
    timeZone: "string",
    groupLabels: "value",
  },
  state: (options) => ({
    ...base.state(options),
    ...shortcutOf(options),
    shortcutText: "",
    keyshortcuts: undefined,
  }),
  sync: (options) => ({ ...base.sync(options), ...shortcutOf(options) }),
  controlled: ["open", "query"],
  api: (context) => {
    const api = base.api(context);
    const getThreads = () => {
      const { actions, canRun } = context.store.get();
      const choices = api.getChoices();
      return canRun ? choices.slice(0, choices.length - actions.length) : choices;
    };
    return Object.defineProperties(api, {
      newThread: {
        get: () => {
          const run = api.run;
          return run ? () => run(NEW) : undefined;
        },
        enumerable: true,
      },
      getThreads: { value: getThreads, enumerable: true },
    }) as ThreadSearchApi;
  },
  slots: (slot) => {
    const picker = base.slots(slot);
    const backdrop = popupBackdrop(slot);
    return {
      ...picker,
      root: slot({
        ...picker.root,
        bind: (_el, { store, api }) => {
          // The keys read differently per platform, so they're written once in the browser: the server and the first
          // client render show none.
          const show = () => {
            const { shortcut, shortcutText, keyshortcuts } = store.get();
            const text = shortcut ? formatShortcut(shortcut) : "";
            const keys = shortcut ? ariaKeyshortcuts(shortcut) : undefined;
            if (shortcutText !== text || keyshortcuts !== keys)
              store.set({ shortcutText: text, keyshortcuts: keys });
          };
          show();
          const unsubscribe = store.subscribe(show);
          // A page shortcut, which a modal pauses; the keys are read on each press.
          const unregister = registerShortcut(
            () => store.get().shortcut,
            (event) => api.setOpen(true, { reason: "shortcut", event }),
            {
              // Checked before the key press is taken, so a disabled or open search leaves the keys to the page.
              when: () => {
                const { open, disabled } = store.get();
                return !open && !disabled;
              },
            },
          );
          return () => {
            unsubscribe();
            unregister();
          };
        },
      }),
      trigger: slot({
        ...picker.trigger,
        attrs: (state, part) => ({
          ...picker.trigger.attrs?.(state, part),
          "aria-keyshortcuts": state.keyshortcuts,
        }),
      }),
      backdrop: slot({
        ...backdrop,
        attrs: (state, part) => ({ ...backdrop.attrs?.(state, part), "data-kind-scrim": "" }),
      }),
      shortcut: slot<BaseSlotProps, { text: string }>({
        present: (state) => state.shortcut !== undefined,
        state: (state) => ({ text: state.shortcutText }),
        attrs: () => ({ "aria-hidden": "true", translate: "no", "data-thread-search-part": "shortcut" }),
      }),
      // The keys a pointer user may not know, shown to the eye only: UI SDK Command handles them.
      hints: slot({
        attrs: () => ({ "aria-hidden": "true", "data-thread-search-part": "hints" }),
      }),
      // A row's status mark, by its row key: named in words, since a status needs them.
      status: slot<BaseSlotProps & { value?: string }>({
        props: { value: "string" },
        role: "img",
        attrs: (state, { api, props }) => {
          const icon = api.itemState(state, props.value ?? "")?.row.icon as ThreadSearchIcon | undefined;
          return {
            "aria-label": icon?.label,
            "data-status-mark": "",
            "data-status": icon?.status,
            "data-thread-search-part": "status",
          };
        },
      }),
    };
  },
  agent: {
    actions: ["open", "close", "search", "select", "newThread"],
    // Not `closed`: the bridge would check `search`'s free text against the threads. `select` refuses an unknown id.
    items: (api) => api.getThreads(),
  },
});
