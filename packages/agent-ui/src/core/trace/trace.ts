import {
  type ChangeDetails,
  createChange,
  createVirtualizer,
  definePrimitive,
  pageLocale,
  type SlotDefinition,
  selects,
  toLocale,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import {
  createWaterfallController,
  type ListHighlightDetails,
  visibleWaterfallRows,
  type WaterfallBarLabelDetails,
  type WaterfallController,
  type WaterfallData,
  type WaterfallDataItem,
  type WaterfallDataRow,
  type WaterfallExpandedChangeReason,
} from "@ui-sdk/core/waterfall";
import type { StepStatus, TraceSpan } from "../../types/index.js";
import { type ComposedHandler, hearComposed } from "../composed-events.js";
import { cached, memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { holdTransitions } from "../step/base.js";
import { type TraceEntry, type TraceSpanKind, traceModel } from "./spans.js";

/**
 * `"item-press"`: a press, or Enter or Space, on a row. `"close-press"`: the details' Close. `"imperative"`: an `api`
 * call, like an agent's `select`.
 */
export type TraceValueChangeReason = "item-press" | "close-press" | "imperative";

/**
 * `"trigger-press"`: a press on a span's arrow. `"list-navigation"`: Right or Left on its row. `"imperative"`: an `api`
 * call, like an agent's `expand`.
 */
export type TraceExpandedChangeReason = WaterfallExpandedChangeReason;

export type TraceOptions = {
  /**
   * The spans, each timed in milliseconds from the trace's start or as ISO 8601 instants, with the spans it started
   * as `children`. A span without `end` is running and grows to now.
   * @default []
   */
  spans?: TraceSpan[];
  /**
   * Names the trace.
   * @default "Trace"
   */
  label?: string;
  /** The selected span's id, whose details show. Passing it controls it: change it in `onValueChange`. */
  value?: string | null;
  /**
   * The selected span at first, when `value` isn't passed.
   * @default null
   */
  defaultValue?: string | null;
  /** Called when a person or `select` selects a span, or Close deselects it, with why. */
  onValueChange?: (value: string | null, details: ChangeDetails<TraceValueChangeReason>) => void;
  /** The ids of the spans whose children show. Passing it controls them: change them in `onExpandedChange`. */
  expanded?: string[];
  /**
   * The expanded spans at first, when `expanded` isn't passed.
   * @default []
   */
  defaultExpanded?: string[];
  /** Called when spans expand or collapse, with why. */
  onExpandedChange?: (expanded: string[], details: ChangeDetails<TraceExpandedChangeReason>) => void;
  /** The stretch of time the axis shows, as `[start, end]` in milliseconds from the trace's start. Change it to zoom. */
  range?: [number, number];
  /**
   * Now, on the spans' clock: milliseconds from the trace's start, or epoch milliseconds or an ISO 8601 instant for
   * spans timed as instants. Without it, spans timed as instants grow each second, and others end where the latest
   * span reached.
   */
  now?: number | string;
  /** The locale times are written in. Defaults to the page's `lang`, else English. */
  locale?: string;
  /**
   * How the bars and rows move. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** A row the viewport renders, at its place among the rows that show. */
export type TraceRow = {
  /** The span's id. */
  key: string;
  /** Its place among the rows that show, from 0. */
  index: number;
  /** Its offset from the top of the Waterfall, in pixels, below the header row. */
  top: number;
  /** Whether its span has children, so its row has an arrow. */
  branch: boolean;
  /** Its row's attributes: the span's `value` and its `aria-rowindex` among every row, the header first. */
  props: { value: string; "aria-rowindex": number };
};

/** What the viewport hands UI SDK Waterfall: pass every key to it. */
export type TraceWaterfallState = {
  /** The primitive's own, which it reads and writes the selection and the expanded spans through. */
  controller: WaterfallController;
  /** Every span, so keyboard navigation knows the whole trace. */
  items: WaterfallData;
  /** The `range`. */
  range: [number, number] | undefined;
  /** The `locale`. */
  locale: string | undefined;
  /** "Starts at 120 ms, takes 340 ms". */
  getBarLabel: (item: WaterfallDataItem, details: WaterfallBarLabelDetails) => string;
  /** The selected span when the Waterfall mounted. */
  defaultValue: string | null;
  /** The expanded spans when the Waterfall mounted. */
  defaultExpanded: string[];
  onValueChange: (value: string | null, details: ChangeDetails<string>) => void;
  onExpandedChange: (expanded: string[], details: ChangeDetails<TraceExpandedChangeReason>) => void;
  onHighlight: (value: string, details: ListHighlightDetails) => void;
  /** The `label`. */
  "aria-label": string;
  /** Every row that shows, the header row included. */
  "aria-rowcount": number;
};

/** The viewport's state: the Waterfall's props, the rows in view and the Waterfall's height. */
export type TraceViewportState = {
  waterfall: TraceWaterfallState;
  rows: TraceRow[];
  /** The Waterfall's height in pixels: the header row and every row that shows. */
  height: number;
};

/** A selected span's details: its name, then its kind, status, start, duration and attributes. */
export type TraceDetailsState = {
  name: string;
  rows: { term: string; detail: string }[];
};

export type TraceState = {
  /** The `spans`. */
  spans: TraceSpan[];
  /** The `label`, else "Trace". */
  label: string;
  /** The `motion` option. */
  motion: MotionMode;
  /** The `locale` option. */
  locale: string | undefined;
  /** The page's language, read as the root binds; `null` before. */
  pageLocale: string | null;
  /** The wall clock, in epoch milliseconds, while spans timed as instants run without `now`; `null` otherwise. */
  clock: number | null;
  /** The `range`. */
  range: [number, number] | undefined;
  /** The Waterfall's spans. */
  items: WaterfallData;
  /** Each span's entry by id. An entry keeps its object while its span and times do. */
  entries: Record<string, TraceEntry>;
  /** Whether any span is running. */
  running: boolean;
  /** Whether the spans are timed as instants. */
  wallClock: boolean;
  /** The selected span's id. */
  value: string | null;
  /** The expanded spans' ids. */
  expanded: string[];
  /** Every row that shows, through `visibleWaterfallRows`. */
  shown: WaterfallDataRow[];
  /** The rows in view, from `createVirtualizer`. */
  rows: TraceRow[];
  /** The rows' height in pixels, without the header row. */
  size: number;
  /** One row's height in pixels, read from `--kind-trace-row-height` as the viewport binds. */
  rowHeight: number;
};

export type TraceApi = {
  /** The selected span's id. */
  getValue: () => string | null;
  /** The expanded spans' ids. */
  getExpanded: () => string[];
  /** The `spans`. */
  getSpans: () => TraceSpan[];
  /** Selects a span, or nothing with `null`. Returns `false` for an unknown id or a refused change. */
  setValue: (id: string | null) => boolean;
  /** Expands exactly these spans. Returns `false` when one has no children, or for a refused change. */
  setExpanded: (ids: string[]) => boolean;
  /** Selects a span, so its details show, as a press on its row would. Returns `false` for an unknown id. */
  select: (id: string) => boolean;
  /** Expands a span and the spans it's in. Returns `false` for a span without children or an unknown id. */
  expand: (id: string) => boolean;
  /** Collapses a span. Returns `false` for a span without children or an unknown id. */
  collapse: (id: string) => boolean;
  /** Writes the selection and the expanded spans into the Waterfall once it has attached the controller. */
  syncWaterfall: () => void;
  /** The viewport's state. Called by the viewport slot. */
  viewportState: (state: TraceState) => TraceViewportState;
  /** The selected span's details. Called by the details slot. */
  detailsState: (state: TraceState) => TraceDetailsState;
  /** A span's duration, in the trace's locale. */
  durationText: (state: TraceState, id: string) => string;
  /** Deselects the span and returns focus to its row. Called by the details' Close. */
  closeDetails: (event?: Event) => void;
  /** Escape in the details returns focus to the selected row. */
  detailsKeydown: (event: KeyboardEvent) => void;
  /** Keeps the row holding focus rendered while it scrolls out of view. */
  focusin: (event: FocusEvent) => void;
  /** UI SDK Waterfall's events on Web Components, heard by the root through `hearComposed`. */
  composedEvents: Record<string, ComposedHandler>;
  /** Reads the page's language, runs the clock and holds transitions for the first frames. Called by the root slot. */
  bindRoot: (el: HTMLElement) => () => void;
  /** Connects the virtualizer. Called by the viewport slot. */
  bindViewport: (el: HTMLElement) => () => void;
};

type SpanProps = { value: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<TraceState, TraceApi, Props, Public>;

type TraceSlots = {
  root: Slot;
  viewport: Slot<BaseSlotProps, TraceViewportState>;
  axis: Slot;
  name: Slot<SpanProps & BaseSlotProps, TraceEntry>;
  status: Slot<SpanProps & BaseSlotProps>;
  duration: Slot<SpanProps & BaseSlotProps, { text: string }>;
  bar: Slot<SpanProps & BaseSlotProps>;
  details: Slot<BaseSlotProps, TraceDetailsState>;
  "details-close": Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type TracePrimitive = ReturnType<
  typeof definePrimitive<TraceOptions, TraceState, TraceApi, TraceSlots>
>;

const ROW_HEIGHT = 28;
// Rows server markup and the first client render share, before the viewport measures.
const FIRST_ROWS = 24;
const noSpans: TraceSpan[] = [];

const STATUS_WORDS: Record<StepStatus, string> = {
  pending: "Pending",
  running: "Running",
  "awaiting-input": "Needs input",
  complete: "Complete",
  error: "Failed",
  cancelled: "Cancelled",
};
const KIND_WORDS: Record<TraceSpanKind, string> = {
  agent: "Agent",
  model: "Model",
  tool: "Tool",
  other: "Span",
};

const formatters = new Map<string, Intl.NumberFormat>();
const formatter = (locale: string, unit: string, digits: number) => {
  const key = `${locale}|${unit}|${digits}`;
  let found = formatters.get(key);
  if (!found) {
    found = new Intl.NumberFormat(locale, {
      style: "unit",
      unit,
      unitDisplay: "short",
      maximumFractionDigits: digits,
    });
    formatters.set(key, found);
  }
  return found;
};

/** Milliseconds as UI SDK Waterfall writes them by default: "120 ms", "1.25 sec", "2.5 min". */
export function traceTime(ms: number, locale = "en-US"): string {
  const size = Math.abs(ms);
  if (size < 1e3) return formatter(locale, "millisecond", size < 10 ? 1 : 0).format(ms);
  if (size < 6e4) return formatter(locale, "second", 2).format(ms / 1e3);
  return formatter(locale, "minute", 1).format(ms / 6e4);
}

const timeLocale = (state: TraceState) => toLocale(state.locale ?? "") ?? state.pageLocale ?? "en-US";
const entryAt = (state: TraceState, id: string) =>
  Object.hasOwn(state.entries, id) ? (state.entries[id] as TraceEntry) : undefined;
const noEntry: TraceEntry = {
  id: "",
  name: "",
  kind: "other",
  status: "pending",
  start: 0,
  duration: 0,
  running: false,
  attributes: [],
};

const sameSet = (a: readonly string[], b: readonly string[]) => {
  const wanted = new Set(b);
  return new Set(a).size === wanted.size && a.every((id) => wanted.has(id));
};

const byValue = ({ props }: { props: Partial<SpanProps> }) => [props.value ?? ""];

/** A row's parts hear only about their own span. */
const ownSpan = selects<TraceState, TraceApi, Partial<SpanProps>>({
  spans: [],
  items: [],
  entries: byValue,
  value: [],
  expanded: [],
  shown: [],
  rows: [],
  size: [],
  clock: [],
  running: [],
});

/** Parts outside the rows hear none of what changes as rows scroll, expand or tick. */
const outsideRows = selects<TraceState, TraceApi, BaseSlotProps>({
  spans: [],
  items: [],
  entries: [],
  value: [],
  expanded: [],
  shown: [],
  rows: [],
  size: [],
  clock: [],
  running: [],
});

const presentation = (options: TraceOptions) => ({
  spans: options.spans ?? noSpans,
  label: options.label ?? "Trace",
  motion: options.motion ?? "auto",
  locale: options.locale,
  range: options.range,
});

// Cached by both arrays rather than with `memo`, so traces side by side don't evict each other's rows.
const shownCache = new WeakMap<WaterfallData, WeakMap<string[], WaterfallDataRow[]>>();
const shownRows = (items: WaterfallData, expanded: string[]) => {
  const byExpanded = cached(shownCache, items, () => new WeakMap<string[], WaterfallDataRow[]>());
  return cached(byExpanded, expanded, () => visibleWaterfallRows(items, expanded));
};

// The first rows at their guessed height, which server markup and the first client render share.
const firstRows = (shown: WaterfallDataRow[], rowHeight: number) =>
  shown
    .slice(0, FIRST_ROWS)
    .map((row) => ({ index: row.index, key: row.item.value, start: row.index * rowHeight }));

export const tracePrimitive: TracePrimitive = definePrimitive<TraceOptions, TraceState, TraceApi, TraceSlots>(
  {
    name: "kind-trace",
    options: {
      spans: "value",
      label: "string",
      value: "value",
      defaultValue: "value",
      onValueChange: "callback",
      expanded: "value",
      defaultExpanded: "value",
      onExpandedChange: "callback",
      range: "value",
      now: "value",
      locale: "string",
      motion: "string",
    },
    state: (initial) => {
      const model = traceModel(initial.spans ?? noSpans, initial.now);
      const expanded = initial.expanded ?? initial.defaultExpanded ?? [];
      const shown = shownRows(model.items, expanded);
      return {
        ...presentation(initial),
        pageLocale: null,
        clock: null,
        items: model.items,
        entries: model.entries,
        running: model.running,
        wallClock: model.wallClock,
        value: initial.value ?? initial.defaultValue ?? null,
        expanded,
        shown,
        rows: placed(firstRows(shown, ROW_HEIGHT), shown, ROW_HEIGHT, new Map()),
        size: shown.length * ROW_HEIGHT,
        rowHeight: ROW_HEIGHT,
      };
    },
    sync: (next) => ({
      ...presentation(next),
      ...(next.value === undefined ? {} : { value: next.value }),
      ...(next.expanded === undefined ? {} : { expanded: next.expanded }),
    }),
    controlled: ["value", "expanded"],
    api: (context) => {
      const { store } = context;
      const change = createChange(context);
      const controller = createWaterfallController();
      const initial = store.get();
      let viewport: HTMLElement | undefined;
      // The span whose row holds focus, kept rendered while it scrolls away.
      let focused: string | undefined;
      let resync = 0;
      let timer: ReturnType<typeof setInterval> | undefined;
      context.onDestroy(() => {
        if (resync) cancelAnimationFrame(resync);
        clearInterval(timer);
      });

      const indexes = memo(
        (shown: WaterfallDataRow[]) => new Map(shown.map((row) => [row.item.value, row.index])),
      );
      const indexOf = (id: string | null | undefined) =>
        id ? (indexes(store.get().shown).get(id) ?? -1) : -1;

      const virtual = createVirtualizer({
        count: () => store.get().shown.length,
        estimate: () => store.get().rowHeight,
        key: (index) => store.get().shown[index]?.item.value ?? String(index),
        // The sticky header row sits above the rows.
        get scrollMargin() {
          return store.get().rowHeight;
        },
        keep: () => [indexOf(focused), indexOf(store.get().value)].filter((index) => index >= 0),
      });
      const rowCache = new Map<string, TraceRow>();
      const showRows = () => {
        const { shown, rowHeight } = store.get();
        store.set({ rows: placed(virtual.items(), shown, rowHeight, rowCache), size: virtual.size() });
      };
      virtual.subscribe(showRows);

      const model = memo((spans: TraceSpan[], now: number | string | undefined) => traceModel(spans, now));
      const remodel = (options = context.options()) => {
        const { spans, clock } = store.get();
        const next = model(spans, options.now ?? clock ?? undefined);
        const state = store.get();
        if (next.items !== state.items)
          store.set({
            items: next.items,
            entries: next.entries,
            running: next.running,
            wallClock: next.wallClock,
          });
        const shown = shownRows(store.get().items, store.get().expanded);
        if (shown === state.shown) return;
        store.set({ shown });
        if (viewport) virtual.refresh();
        else {
          const rows = placed(firstRows(shown, state.rowHeight), shown, state.rowHeight, rowCache);
          store.set({ rows, size: shown.length * state.rowHeight });
        }
      };
      context.onOptions((next) => remodel(next));
      store.subscribe(() => {
        const { items, expanded, shown } = store.get();
        if (shownRows(items, expanded) !== shown) remodel();
      });

      // A one-second clock while spans timed as instants run and the host passes no `now`.
      const tick = () => {
        store.set({ clock: Date.now() });
        remodel();
      };
      const followClock = () => {
        const { running, wallClock } = store.get();
        const wanted = running && wallClock && context.options().now === undefined;
        if (wanted && timer === undefined) {
          timer = setInterval(tick, 1000);
          tick();
        } else if (!wanted && timer !== undefined) {
          clearInterval(timer);
          timer = undefined;
          if (store.get().clock !== null) store.set({ clock: null });
        }
      };

      // Held while a person's change is reported, so writing back doesn't undo the change being read.
      let reading = false;
      const syncWaterfall = () => {
        if (reading) return;
        const { value, expanded } = store.get();
        // The controller reads `undefined` until the Waterfall attaches it.
        const shown = controller.getExpanded() as string[] | undefined;
        if (shown === undefined) return;
        if (!sameSet(shown, expanded)) controller.setExpanded(expanded);
        if (controller.getValue() !== value) controller.setValue(value);
      };
      store.subscribe(syncWaterfall);
      // A change a controlling owner didn't take by the next frame is written back: the Waterfall holds its own.
      const writeBackUntaken = () => {
        const { value, expanded } = context.options();
        if (value === undefined && expanded === undefined) return;
        if (resync) cancelAnimationFrame(resync);
        resync = requestAnimationFrame(syncWaterfall);
      };

      const onValueChange = (value: string | null, details: ChangeDetails<string>) => {
        if (value === store.get().value) return;
        reading = true;
        const { reason, event } = details;
        const accepted = change(
          "value",
          value,
          event
            ? { reason: reason as TraceValueChangeReason, event }
            : { reason: reason as TraceValueChangeReason },
        );
        reading = false;
        if (!accepted) details.cancel();
        else writeBackUntaken();
      };
      const onExpandedChange = (expanded: string[], details: ChangeDetails<TraceExpandedChangeReason>) => {
        if (sameSet(expanded, store.get().expanded)) return;
        reading = true;
        const { reason, event } = details;
        const accepted = change("expanded", expanded, event ? { reason, event } : { reason });
        reading = false;
        if (!accepted) details.cancel();
        else writeBackUntaken();
      };
      // The keyboard moved to a row that may not be rendered: scrolled into view, it renders and takes focus.
      const onHighlight = (value: string, { index }: ListHighlightDetails) => {
        focused = value;
        if (index >= 0) virtual.scrollToIndex(index);
      };
      const getBarLabel = (item: WaterfallDataItem, { start, duration }: WaterfallBarLabelDetails) =>
        entryAt(store.get(), item.value)?.running
          ? `Starts at ${start}, running for ${duration}`
          : `Starts at ${start}, takes ${duration}`;

      const waterfallState = memo(
        (
          items: WaterfallData,
          range: [number, number] | undefined,
          locale: string | undefined,
          label: string,
          count: number,
        ): TraceWaterfallState => ({
          controller,
          items,
          range,
          locale,
          getBarLabel,
          defaultValue: initial.value,
          defaultExpanded: initial.expanded,
          onValueChange,
          onExpandedChange,
          onHighlight,
          "aria-label": label,
          "aria-rowcount": count + 1,
        }),
      );
      const viewportState = memo(
        (waterfall: TraceWaterfallState, rows: TraceRow[], height: number): TraceViewportState => ({
          waterfall,
          rows,
          height,
        }),
      );

      const detailsState = memo((entry: TraceEntry | undefined, locale: string): TraceDetailsState => {
        if (!entry) return { name: "", rows: [] };
        return {
          name: entry.name,
          rows: [
            { term: "Kind", detail: KIND_WORDS[entry.kind] },
            { term: "Status", detail: STATUS_WORDS[entry.status] ?? entry.status },
            { term: "Start", detail: traceTime(entry.start, locale) },
            { term: "Duration", detail: traceTime(entry.duration, locale) },
            ...entry.attributes.map(([term, detail]) => ({ term, detail })),
          ],
        };
      });

      const known = (id: string) => entryAt(store.get(), id) !== undefined;
      const isBranch = (id: string) => branchIds(store.get().items).has(id);
      const setValue = (id: string | null, reason: TraceValueChangeReason = "imperative", event?: Event) =>
        id === store.get().value || change("value", id, event ? { reason, event } : { reason });
      const setExpanded = (ids: string[]) =>
        sameSet(ids, store.get().expanded) || change("expanded", [...new Set(ids)], { reason: "imperative" });

      // Returns focus to the selected row, scrolling it into view first when it isn't rendered.
      const returnFocus = (id: string | null) => {
        if (id && known(id)) controller.reveal(id);
      };

      // `@ui-sdk/web` fires the Waterfall's events on `ui-waterfall` without bubbling.
      const composedEvents: Record<string, ComposedHandler> = {
        valuechange: (detail, event) => {
          if ((event.target as Element).localName !== "ui-waterfall") return;
          const { value, ...rest } = detail as { value: string | null } & Omit<
            ChangeDetails<string>,
            "cancel"
          >;
          onValueChange(value, { ...rest, cancel: () => event.preventDefault() } as ChangeDetails<string>);
        },
        expandedchange: (detail, event) => {
          if ((event.target as Element).localName !== "ui-waterfall") return;
          const { value, ...rest } = detail as { value: string[] } & Omit<
            ChangeDetails<TraceExpandedChangeReason>,
            "cancel"
          >;
          onExpandedChange(value, {
            ...rest,
            cancel: () => event.preventDefault(),
          } as ChangeDetails<TraceExpandedChangeReason>);
        },
        highlight: (detail, event) => {
          if ((event.target as Element).localName !== "ui-waterfall") return;
          const { value, ...rest } = detail as { value: string } & ListHighlightDetails;
          onHighlight(value, rest);
        },
      };

      return {
        getValue: () => store.get().value,
        getExpanded: () => store.get().expanded,
        getSpans: () => store.get().spans,
        setValue: (id) => (id === null || known(id)) && setValue(id),
        setExpanded: (ids) => ids.every(isBranch) && setExpanded(ids),
        select: (id) => known(id) && setValue(id),
        expand: (id) =>
          isBranch(id) && setExpanded([...store.get().expanded, ...ancestorsOf(store.get().items, id), id]),
        collapse: (id) => isBranch(id) && setExpanded(store.get().expanded.filter((open) => open !== id)),
        syncWaterfall,
        viewportState: (state) =>
          viewportState(
            waterfallState(state.items, state.range, state.locale, state.label, state.shown.length),
            state.rows,
            state.size + state.rowHeight,
          ),
        detailsState: (state) =>
          detailsState(state.value === null ? undefined : entryAt(state, state.value), timeLocale(state)),
        durationText: (state, id) => {
          const entry = entryAt(state, id);
          return entry ? traceTime(entry.duration, timeLocale(state)) : "";
        },
        closeDetails: (event) => {
          const { value } = store.get();
          if (setValue(null, "close-press", event)) returnFocus(value);
        },
        detailsKeydown: (event) => {
          if (event.key !== "Escape" || event.defaultPrevented) return;
          event.preventDefault();
          returnFocus(store.get().value);
        },
        focusin: (event) => {
          const row = (event.target as Element).closest('[role="row"]');
          const id = row?.querySelector('[data-trace-part="name"]')?.getAttribute("data-span");
          if (id) focused = id;
        },
        composedEvents,
        bindRoot: (el) => {
          const locale = toLocale(pageLocale(el) ?? "") ?? null;
          if (locale !== store.get().pageLocale) store.set({ pageLocale: locale });
          const release = holdTransitions(el);
          const stopEvents = hearComposed(el, composedEvents);
          followClock();
          const unsubscribe = store.subscribe(followClock);
          syncWaterfall();
          return () => {
            release();
            stopEvents();
            unsubscribe();
            clearInterval(timer);
            timer = undefined;
          };
        },
        bindViewport: (el) => {
          viewport = el;
          const height = Number.parseFloat(getComputedStyle(el).getPropertyValue("--kind-trace-row-height"));
          if (height > 0 && height !== store.get().rowHeight) {
            store.set({ rowHeight: height });
            virtual.reset();
          }
          const disconnect = virtual.connect(el);
          return () => {
            disconnect();
            viewport = undefined;
          };
        },
      };
    },
    slots: (slot) => ({
      root: slot({
        role: "group",
        selects: outsideRows,
        attrs: (state) => ({
          "aria-label": state.label,
          "data-trace-part": "root",
          "data-motion": state.motion,
        }),
        on: {
          focusin: (event, { api }) => api.focusin(event as FocusEvent),
        },
        bind: (el, { api }) => api.bindRoot(el),
      }),
      viewport: slot<BaseSlotProps, TraceViewportState>({
        selects: selects<TraceState, TraceApi, BaseSlotProps>({
          spans: [],
          entries: [],
          value: [],
          expanded: [],
          clock: [],
          running: [],
          pageLocale: [],
        }),
        state: (state, { api }) => api.viewportState(state),
        attrs: () => ({ "data-trace-part": "viewport" }),
        bind: (el, { api }) => api.bindViewport(el),
      }),
      // The ruler above the bars, which holds UI SDK's axis. Hidden from screen readers, who hear each bar's times.
      axis: slot({
        selects: outsideRows,
        attrs: () => ({ "data-trace-part": "axis" }),
      }),
      // A row's name: the kind's glyph (CSS), and the label. Its status mark follows it.
      name: slot<SpanProps & BaseSlotProps, TraceEntry>({
        props: { value: "string" },
        selects: ownSpan,
        state: (state, { props }) => entryAt(state, props.value) ?? noEntry,
        attrs: (state, { props }) => {
          const entry = entryAt(state, props.value) ?? noEntry;
          return { "data-trace-part": "name", "data-span": props.value, "data-kind": entry.kind };
        },
      }),
      status: slot<SpanProps & BaseSlotProps>({
        role: "img",
        props: { value: "string" },
        selects: ownSpan,
        attrs: (state, { props }) => {
          const status = (entryAt(state, props.value) ?? noEntry).status;
          return {
            "aria-label": STATUS_WORDS[status],
            "data-trace-part": "status",
            "data-status-mark": "",
            "data-status": status,
          };
        },
      }),
      duration: slot<SpanProps & BaseSlotProps, { text: string }>({
        props: { value: "string" },
        selects: selects<TraceState, TraceApi, Partial<SpanProps>>({
          spans: [],
          items: [],
          entries: byValue,
          value: [],
          expanded: [],
          shown: [],
          rows: [],
          size: [],
          clock: [],
          running: [],
        }),
        state: (state, { props, api }) => ({ text: api.durationText(state, props.value) }),
        attrs: () => ({ "data-trace-part": "duration" }),
      }),
      // The bar, drawn inside UI SDK's bar cell from its row's `--waterfall-start` and `--waterfall-size`.
      bar: slot<SpanProps & BaseSlotProps>({
        props: { value: "string" },
        selects: ownSpan,
        attrs: (state, { props }) => {
          const entry = entryAt(state, props.value) ?? noEntry;
          return {
            "aria-hidden": "true",
            "data-trace-part": "bar",
            "data-kind": entry.kind,
            "data-status": entry.status,
            "data-running": entry.running ? "" : undefined,
          };
        },
      }),
      details: slot<BaseSlotProps, TraceDetailsState>({
        role: "group",
        selects: selects<TraceState, TraceApi, BaseSlotProps>({
          spans: [],
          items: [],
          expanded: [],
          shown: [],
          rows: [],
          size: [],
          clock: [],
          running: [],
        }),
        present: (state) => state.value !== null && entryAt(state, state.value) !== undefined,
        state: (state, { api }) => api.detailsState(state),
        attrs: (state) => {
          const entry = state.value === null ? undefined : entryAt(state, state.value);
          return { "aria-label": entry ? `${entry.name} details` : undefined, "data-trace-part": "details" };
        },
        on: {
          keydown: (event, { api }) => api.detailsKeydown(event as KeyboardEvent),
        },
      }),
      "details-close": slot({
        role: "button",
        focus: "native",
        selects: outsideRows,
        press: ({ api }, event) => api.closeDetails(event),
        attrs: () => ({
          "aria-label": "Close details",
          "data-trace-part": "details-close",
          "data-kind-icon-button": "",
        }),
      }),
    }),
    // Spans are listed by id, so an agent can name one to `select`, `expand` or `collapse`.
    agent: {
      actions: ["select", "expand", "collapse"],
      items: (api: TraceApi) => {
        const out: { value: string; label: string }[] = [];
        const visit = (spans: TraceSpan[]) => {
          for (const span of spans) {
            out.push({ value: span.id, label: span.name });
            if (span.children) visit(span.children);
          }
        };
        visit(api.getSpans());
        return out;
      },
      closed: true,
    },
  },
);

/** The virtualizer's rows with their spans' places and attributes. A row keeps its object while it stays put. */
function placed(
  items: { index: number; key: string; start: number }[],
  shown: WaterfallDataRow[],
  rowHeight: number,
  cache: Map<string, TraceRow>,
): TraceRow[] {
  const rows = items.map(({ index, key, start }) => {
    const top = start + rowHeight;
    const branch = !!shown[index]?.item.children;
    const kept = cache.get(key);
    if (kept && kept.index === index && kept.top === top && kept.branch === branch) return kept;
    const row = { key, index, top, branch, props: { value: key, "aria-rowindex": index + 2 } };
    cache.set(key, row);
    return row;
  });
  if (cache.size > rows.length * 4 + 64) {
    const kept = new Set(rows.map((row) => row.key));
    for (const key of cache.keys()) if (!kept.has(key)) cache.delete(key);
  }
  return rows;
}

const branchCache = new WeakMap<WaterfallData, Set<string>>();
function branchIds(items: WaterfallData): Set<string> {
  let found = branchCache.get(items);
  if (!found) {
    const set = new Set<string>();
    const visit = (level: WaterfallData) => {
      for (const item of level) {
        if (item.children) {
          set.add(item.value);
          visit(item.children);
        }
      }
    };
    visit(items);
    branchCache.set(items, set);
    found = set;
  }
  return found;
}

function ancestorsOf(items: WaterfallData, id: string): string[] {
  const path: string[] = [];
  const visit = (level: WaterfallData): boolean => {
    for (const item of level) {
      if (item.value === id) return true;
      if (item.children) {
        path.push(item.value);
        if (visit(item.children)) return true;
        path.pop();
      }
    }
    return false;
  };
  return visit(items) ? path : [];
}
