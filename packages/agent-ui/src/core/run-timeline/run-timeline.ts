import {
  type ChangeSource,
  createFocusRecovery,
  definePrimitive,
  type FocusRecovery,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { RunEvent, StepStatus } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { holdTransitions } from "../step/base.js";
import { timeLabel, todayKey } from "../time.js";
import { everyMinute } from "../today.js";

/** `"more-press"`: a person pressed Show earlier. `"imperative"`: an `api` call. */
export type RunTimelineLoadReason = "more-press" | "imperative";

export type RunTimelineLoadDetails = {
  reason: RunTimelineLoadReason;
  /** Who caused it, like `"mouse"`, `"keyboard"` or `"agent"`. */
  source: ChangeSource;
};

export type RunTimelineOrder = "oldest-first" | "newest-first";

export type RunTimelineOptions = {
  /** The run's events, oldest first. Keep each one's `id` as the list grows. Defaults to none. */
  events?: RunEvent[];
  /**
   * Names the timeline.
   * @default "Activity"
   */
  label?: string;
  /**
   * Which event shows first.
   * @default "oldest-first"
   */
  order?: RunTimelineOrder;
  /**
   * Whether the events are a feed of articles, which Page Down and Page Up move between, for long histories.
   * @default false
   */
  feed?: boolean;
  /**
   * Whether earlier events are loading: a loading row takes Show earlier's place, and a feed tells screen readers
   * to wait.
   * @default false
   */
  busy?: boolean;
  /**
   * Whether there are earlier events to load. Show earlier shows while it's `true` and `onLoadMore` is set.
   * @default false
   */
  hasMore?: boolean;
  /** Called by Show earlier to load earlier events. Set `busy` while they load. */
  onLoadMore?: (details: RunTimelineLoadDetails) => void;
  /** Today, as an ISO date or instant, in place of the browser's clock. */
  now?: string;
  /**
   * The language times read in, a BCP 47 tag.
   * @default "en"
   */
  locale?: string;
  /**
   * The IANA time zone times read in, like `"Europe/Paris"`.
   * @default "UTC"
   */
  timeZone?: string;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** An event as the timeline shows it. An event that didn't change keeps its entry. */
export type RunTimelineEntry = {
  title: string;
  /** The event's `at`, for `<time datetime>`. */
  at: string;
  description: string;
  /** The actor's name, `""` without one. */
  actor: string;
  status: StepStatus | undefined;
  /** The status in words, after the title for screen readers: `""` without one or for `complete`. */
  statusText: string;
  /** Whether it's the newest event and still running, which UI SDK Timeline marks `aria-current="step"`. */
  current: boolean;
};

export type RunTimelineState = {
  label: string;
  order: RunTimelineOrder;
  feed: boolean;
  busy: boolean;
  /** Whether Show earlier can show: `hasMore` with `onLoadMore` set. */
  canLoadMore: boolean;
  /** The event ids, in the order they show. */
  rows: string[];
  /** Each event as the timeline shows it, by id. */
  entries: Record<string, RunTimelineEntry>;
  /** The `now` option, else today once the root binds; `undefined` on the server, so times show their date. */
  now: string | undefined;
  locale: string | undefined;
  timeZone: string | undefined;
  motion: MotionMode;
};

/** What the root's render function gets: UI SDK Timeline's props and the rows to draw. */
export type RunTimelineRootState = Pick<
  RunTimelineState,
  "label" | "feed" | "busy" | "order" | "rows" | "entries"
>;

export type RunTimelineTimeState = { label: string; dateTime: string };
/** Whether earlier events are loading, and whether Show earlier shows. */
export type RunTimelineEndState = { busy: boolean; canLoadMore: boolean };
/** The title, and the event's status in words, `""` for none or `complete`. */
export type RunTimelineTitleState = { title: string; status: string };

export type RunTimelineApi = {
  /** Calls `onLoadMore`, as Show earlier does. Offered while Show earlier shows and nothing is loading. */
  readonly loadMore: ((event?: Event) => void) | undefined;
  /** The events as agent items, `{ value: id, label: title }`. */
  eventItems: () => { value: string; label: string }[];
  /** The root's, an event's time and title parts' and the end's states, memoized. */
  rootState: (state: RunTimelineState) => RunTimelineRootState;
  timeState: (state: RunTimelineState, id: string) => RunTimelineTimeState;
  titleState: (state: RunTimelineState, id: string) => RunTimelineTitleState;
  endState: (state: RunTimelineState) => RunTimelineEndState;
  /** Moves focus to the timeline when Show earlier leaves while focused. */
  moreRecovery: FocusRecovery;
  /** Plays an event's entrance when it arrives after the first frame. Called by the item slot. */
  bindItem: (el: HTMLElement, id: string) => void;
  /** Reads today and starts counting events as new after the first frame. Called by the root slot. */
  bindRoot: (el: HTMLElement) => () => void;
};

type ItemProps = { value: string };
type ItemPartProps = { value?: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<RunTimelineState, RunTimelineApi, Props, Public>;
type ItemSlot<Public extends object = Record<never, never>> = Slot<ItemPartProps & BaseSlotProps, Public>;

type RunTimelineSlots = {
  root: Slot<BaseSlotProps, RunTimelineRootState>;
  item: Slot<ItemProps & BaseSlotProps>;
  marker: ItemSlot;
  title: ItemSlot<RunTimelineTitleState>;
  time: ItemSlot<RunTimelineTimeState>;
  actor: ItemSlot<{ name: string }>;
  description: ItemSlot<{ description: string }>;
  end: Slot<BaseSlotProps, RunTimelineEndState>;
  more: Slot<BaseSlotProps, { busy: boolean }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type RunTimelinePrimitive = ReturnType<
  typeof definePrimitive<RunTimelineOptions, RunTimelineState, RunTimelineApi, RunTimelineSlots>
>;

// A marker shows status only to sighted people, so the title says it too, after the visible text.
const STATUS_WORDS: Record<StepStatus, string> = {
  pending: "pending",
  running: "running",
  "awaiting-input": "needs input",
  complete: "",
  error: "failed",
  cancelled: "cancelled",
};

const noEvents: RunEvent[] = [];
const noEntry: RunTimelineEntry = {
  title: "",
  at: "",
  description: "",
  actor: "",
  status: undefined,
  statusText: "",
  current: false,
};
// Own keys only, so an item `value` like "constructor" doesn't find `Object`'s.
const entryAt = ({ entries }: RunTimelineState, key: string) =>
  Object.hasOwn(entries, key) ? (entries[key] as RunTimelineEntry) : noEntry;
const fromItem = { value: { kind: "string", from: "item" } } as const;

const sameEntry = (a: RunTimelineEntry, b: RunTimelineEntry) =>
  a.title === b.title &&
  a.at === b.at &&
  a.description === b.description &&
  a.actor === b.actor &&
  a.status === b.status &&
  a.current === b.current;

const orderOf = (order: string | undefined): RunTimelineOrder =>
  order === "newest-first" ? "newest-first" : "oldest-first";

/** Each event's entry, keeping `previous` ones that didn't change, and the ids in the order they show. */
const rowsOf = (
  events: RunEvent[],
  order: RunTimelineOrder,
  previous: Record<string, RunTimelineEntry>,
): Pick<RunTimelineState, "rows" | "entries"> => {
  const newest = events[events.length - 1];
  const entries: Record<string, RunTimelineEntry> = {};
  for (const event of events) {
    const entry: RunTimelineEntry = {
      title: event.title,
      at: event.at,
      description: event.description ?? "",
      actor: event.actor?.name ?? "",
      status: event.status,
      statusText: event.status ? STATUS_WORDS[event.status] : "",
      current: event === newest && event.status === "running",
    };
    const kept = Object.hasOwn(previous, event.id) ? previous[event.id] : undefined;
    entries[event.id] = kept && sameEntry(kept, entry) ? kept : entry;
  }
  const ids = events.map((event) => event.id);
  return { entries, rows: order === "newest-first" ? ids.reverse() : ids };
};

/** An event's parts hear only about their own event. */
const own = selects<RunTimelineState, RunTimelineApi, ItemPartProps>({
  entries: ({ key }) => [key],
  rows: [],
  label: [],
  order: [],
  feed: [],
  busy: [],
  canLoadMore: [],
  now: [],
  locale: [],
  timeZone: [],
});
// The time part reads today, the locale and the time zone too.
const ownTime = selects<RunTimelineState, RunTimelineApi, ItemPartProps>({
  entries: ({ key }) => [key],
  rows: [],
  label: [],
  order: [],
  feed: [],
  busy: [],
  canLoadMore: [],
});
// Parts outside the events never hear about them.
const outsideRows = selects<RunTimelineState, RunTimelineApi, BaseSlotProps>({
  rows: [],
  entries: [],
  now: [],
});

const presentation = (options: RunTimelineOptions) => ({
  label: options.label || "Activity",
  order: orderOf(options.order),
  feed: options.feed ?? false,
  busy: options.busy ?? false,
  canLoadMore: (options.hasMore ?? false) && options.onLoadMore !== undefined,
  locale: options.locale || undefined,
  timeZone: options.timeZone || undefined,
  motion: options.motion ?? "auto",
});

export const runTimelinePrimitive: RunTimelinePrimitive = definePrimitive<
  RunTimelineOptions,
  RunTimelineState,
  RunTimelineApi,
  RunTimelineSlots
>({
  name: "kind-run-timeline",
  options: {
    events: "value",
    label: "string",
    order: "string",
    feed: "boolean",
    busy: "boolean",
    hasMore: "boolean",
    onLoadMore: "callback",
    now: "string",
    locale: "string",
    timeZone: "string",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    ...rowsOf(options.events ?? noEvents, orderOf(options.order), {}),
    now: options.now || undefined,
  }),
  sync: presentation,
  api: (context) => {
    const { store } = context;
    // `events` reaches state here rather than through `sync`, since a synced key that changes renders every React part
    // whatever its `selects` say.
    let events: RunEvent[] | undefined;
    let order: RunTimelineOrder | undefined;
    let clock = false;
    const today = (options: RunTimelineOptions) =>
      options.now || (clock ? todayKey(options.timeZone || undefined) : undefined);
    context.onOptions((options) => {
      const nextOrder = orderOf(options.order);
      if (options.events !== events || nextOrder !== order) {
        events = options.events;
        order = nextOrder;
        store.set(rowsOf(events ?? noEvents, order, store.get().entries));
      }
      const now = today(options);
      if (now !== store.get().now) store.set({ now });
    });

    // Web hosts can only set `events` once the element exists, so events in the first frame count as known and don't
    // play the entrance.
    let mounting = true;
    const known = new Set(store.get().rows);

    const rootState = memo(
      (
        label: string,
        feed: boolean,
        busy: boolean,
        order: RunTimelineOrder,
        rows: string[],
        entries: Record<string, RunTimelineEntry>,
      ): RunTimelineRootState => ({ label, feed, busy, order, rows, entries }),
    );
    const endState = memo((busy: boolean, canLoadMore: boolean) => ({ busy, canLoadMore }));
    const titles = new WeakMap<RunTimelineEntry, RunTimelineTitleState>();
    const times = new Map<string, { inputs: unknown[]; value: RunTimelineTimeState }>();
    return {
      get loadMore() {
        const { canLoadMore, busy } = store.get();
        if (!canLoadMore || busy) return undefined;
        return (event?: Event) => {
          const reason: RunTimelineLoadReason = event ? "more-press" : "imperative";
          context.options().onLoadMore?.({ reason, source: actionSource(event, reason) });
        };
      },
      eventItems: () => {
        const state = store.get();
        return state.rows.map((id) => ({ value: id, label: entryAt(state, id).title }));
      },
      rootState: (state) =>
        rootState(state.label, state.feed, state.busy, state.order, state.rows, state.entries),
      timeState: (state, id) => {
        const { at } = entryAt(state, id);
        const inputs = [at, state.now, state.locale, state.timeZone];
        const kept = times.get(id);
        if (kept?.inputs.every((input, index) => Object.is(input, inputs[index]))) return kept.value;
        const value = {
          label: timeLabel(at, { now: state.now, locale: state.locale, timeZone: state.timeZone }),
          dateTime: at,
        };
        times.set(id, { inputs, value });
        return value;
      },
      titleState: (state, id) => {
        const entry = entryAt(state, id);
        let value = titles.get(entry);
        if (!value) {
          value = { title: entry.title, status: entry.statusText };
          titles.set(entry, value);
        }
        return value;
      },
      endState: (state) => endState(state.busy, state.canLoadMore),
      // Show earlier sits before the oldest event, which is the first row oldest first and the last newest first.
      moreRecovery: createFocusRecovery({
        fallback: () => {
          const { rows, order } = store.get();
          const oldest = order === "oldest-first" ? rows[0] : rows.at(-1);
          return oldest === undefined
            ? undefined
            : (context.element("item", oldest)?.querySelector<HTMLElement>('[data-slot="timeline-item"]') ??
                undefined);
        },
      }),
      bindItem: (el, id) => {
        if (known.has(id)) return;
        known.add(id);
        if (!mounting) void enter(el, "fade-up", { motion: store.get().motion });
      },
      bindRoot: (el) => {
        const release = holdTransitions(el);
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        // Read here, never in `state`, so server markup shows each date and hydrates before the words change.
        clock = true;
        const read = () => {
          const now = today(context.options());
          if (now !== store.get().now) store.set({ now });
        };
        read();
        const stop = everyMinute(read);
        return () => {
          release();
          cancelAnimationFrame(frame);
          stop();
          clock = false;
        };
      },
    };
  },
  slots: (slot) => ({
    // A group named by the `label`, which names the component for agents; UI SDK Timeline inside it is the list.
    root: slot<BaseSlotProps, RunTimelineRootState>({
      role: "group",
      state: (state, { api }) => api.rootState(state),
      attrs: (state) => ({
        "aria-label": state.label,
        "data-run-timeline-part": "root",
        "data-order": state.order,
        "data-motion": state.motion,
      }),
      bind: (el, { api }) => api.bindRoot(el),
    }),
    // Around UI SDK's TimelineItem, which binds the list item itself; a generic wrapper the list looks through.
    item: slot<ItemProps & BaseSlotProps>({
      props: { value: "string" },
      selects: own,
      attrs: (state, { key }) => ({
        "data-run-timeline-part": "item",
        "data-status": entryAt(state, key).status,
      }),
      bind: (el, { api, key }) => {
        api.bindItem(el, key);
        return holdTransitions(el);
      },
    }),
    marker: slot<ItemPartProps & BaseSlotProps>({
      props: fromItem,
      selects: own,
      attrs: (state, { key }) => {
        const { status } = entryAt(state, key);
        return {
          "aria-hidden": "true",
          "data-run-timeline-part": "marker",
          "data-status-mark": status === undefined ? undefined : "",
          "data-status": status,
          "data-motion": state.motion,
        };
      },
    }),
    title: slot<ItemPartProps & BaseSlotProps, RunTimelineTitleState>({
      props: fromItem,
      selects: own,
      state: (state, { api, key }) => api.titleState(state, key),
      attrs: () => ({ "data-run-timeline-part": "title" }),
    }),
    time: slot<ItemPartProps & BaseSlotProps, RunTimelineTimeState>({
      props: fromItem,
      selects: ownTime,
      state: (state, { api, key }) => api.timeState(state, key),
      attrs: () => ({ "data-run-timeline-part": "time" }),
    }),
    actor: slot<ItemPartProps & BaseSlotProps, { name: string }>({
      props: fromItem,
      selects: own,
      present: (state, { key }) => entryAt(state, key).actor !== "",
      state: (state, { key }) => ({ name: entryAt(state, key).actor }),
      attrs: () => ({ "data-run-timeline-part": "actor" }),
    }),
    description: slot<ItemPartProps & BaseSlotProps, { description: string }>({
      props: fromItem,
      selects: own,
      present: (state, { key }) => entryAt(state, key).description !== "",
      state: (state, { key }) => ({ description: entryAt(state, key).description }),
      attrs: () => ({ "data-run-timeline-part": "description" }),
    }),
    // Show earlier, or "Loading" while `busy` without it.
    end: slot<BaseSlotProps, RunTimelineEndState>({
      selects: outsideRows,
      present: (state) => state.busy || state.canLoadMore,
      state: (state, { api }) => api.endState(state),
      attrs: (state) => ({
        "data-run-timeline-part": "end",
        "data-busy": state.busy ? "" : undefined,
      }),
    }),
    // Stays while `busy`, reading "Loading", so focus stays on it until the earlier events arrive.
    more: slot<BaseSlotProps, { busy: boolean }>({
      role: "button",
      focus: "native",
      selects: outsideRows,
      present: (state) => state.canLoadMore,
      press: ({ api }, event) => api.loadMore?.(event),
      state: (state) => ({ busy: state.busy }),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.busy ? "true" : undefined,
        "data-run-timeline-part": "more",
        "data-kind-button": "",
        "data-kind-size": "sm",
      }),
      bind: (el, part) => part.api.moreRecovery.bind(el, part),
    }),
  }),
  agent: { actions: [], items: (api) => api.eventItems(), closed: true },
});
