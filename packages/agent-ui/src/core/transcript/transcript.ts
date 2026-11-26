import {
  announce,
  type ChangeDetails,
  createChange,
  createVirtualizer,
  css,
  direct,
  dispatch,
  type PrimitiveContext,
  pageLocale,
  type SlotDefinition,
  selects,
  toLocale,
  type VirtualItem,
} from "@ui-sdk/core";
import { createInputController, type InputController } from "@ui-sdk/core/input";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { MatchSegment } from "@ui-sdk/core/text-match";
import type { TranscriptSegment } from "../../types/index.js";
import { definePrimitive } from "../define-primitive.js";
import { createListFocus, type ListFocus } from "../list-focus.js";
import { cached, memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { resolveMotion } from "../motion/presets.js";
import { holdTransitions } from "../step/base.js";
import { currentAt, highlightPieces, searchSegments, segmentPieces } from "./search.js";

/** `"input-change"`: a person typed in the search field or cleared it. `"imperative"`: an `api` call, like an agent's. */
export type TranscriptQueryChangeReason = "input-change" | "imperative";
/** `"segment-press"`: a press on a segment, or Enter on its time. `"imperative"`: an `api` call, like an agent's. */
export type TranscriptSeekReason = "segment-press" | "imperative";

export type TranscriptOptions = {
  /**
   * The speakers' turns, in time order.
   * @default []
   */
  segments?: TranscriptSegment[];
  /**
   * Names the transcript.
   * @default "Transcript"
   */
  label?: string;
  /** Where playback is, in seconds. The segment at that time and its word are marked as playing. */
  currentTime?: number;
  /** Called when someone seeks to a segment, with its start in seconds. Makes each segment's time a button. */
  onSeek?: (time: number, details: ChangeDetails<TranscriptSeekReason>) => void;
  /** The search. Passing it controls it: change it in `onQueryChange`. */
  query?: string;
  /**
   * The search at first, when `query` isn't passed.
   * @default ""
   */
  defaultQuery?: string;
  /** Called when the search changes, with why. */
  onQueryChange?: (query: string, details: ChangeDetails<TranscriptQueryChangeReason>) => void;
  /**
   * Whether the segment playing scrolls into view as playback moves, while focus isn't inside the transcript.
   * @default true
   */
  follow?: boolean;
  /** The language times are written in. Defaults to the page's language. */
  locale?: string;
  /**
   * How segments enter and the view follows playback. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type TranscriptState = {
  /** The `label`, else "Transcript". */
  label: string;
  /** The `segments`. */
  segments: TranscriptSegment[];
  /** The segments by id. */
  segmentsById: Record<string, TranscriptSegment>;
  /** The search. */
  query: string;
  /** The segments the search matches, in time order: every segment without a search. */
  shown: TranscriptSegment[];
  /** How many segments the search matches. */
  matches: number;
  /** The shown segments to render, from `createVirtualizer`, each keyed by its segment's id. */
  rows: readonly VirtualItem[];
  /** The height of every shown segment together, in pixels. */
  size: number;
  /** Whether the virtualizer has measured the segments, so they sit at its offsets rather than one after another. */
  measured: boolean;
  /** The id of the segment playing, or `null`. */
  currentSegment: string | null;
  /** The word playing, as `"<segment id>/<index>"`, or `null`. */
  currentWord: string | null;
  /** The `follow` option. */
  follow: boolean;
  /** Whether `onSeek` is set, which makes each segment's time a button. */
  canSeek: boolean;
  /** The `locale` option, if it's a valid language tag. */
  locale: string | undefined;
  /** The page's language, read as the root binds. */
  pageLocale: string | null;
  /** Ids of segments that arrived in the last update, which fade in once. */
  entering: readonly string[];
  /** The segment whose time holds the list's Tab stop. */
  focused: string | null;
  /** The `motion` option. */
  motion: MotionMode;
};

/** A part inside a segment, which takes the segment's `value`. */
export type TranscriptItemPartProps = { value?: string };

/** What the search part hands UI SDK Input: pass every key to it. */
export type TranscriptSearchState = {
  /** The primitive's own, which it reads and writes the search through. */
  controller: InputController;
  /** The search when the Input mounted. */
  defaultValue: string;
  /** Names the field: "Search transcript". */
  label: string;
};

export type TranscriptApi = ListFocus<TranscriptState, TranscriptItemPartProps> & {
  /** Searches the segments, as typing does. An empty `text` shows every segment. Returns whether it was accepted. */
  search: (text: string) => boolean;
  /** The search. */
  getQuery: () => string;
  /** The `segments`. */
  getSegments: () => TranscriptSegment[];
  /** When the segment whose id is `id` starts, as its time part shows it, like "1:05". */
  timeOf: (id: string) => string;
  /**
   * Calls `onSeek` with the start of the segment whose id is `id`. Returns false for an unknown id. Only while `onSeek`
   * is set.
   */
  readonly seek: ((id: string, event?: Event) => boolean) | undefined;
  /**
   * Seeks to the pressed segment, unless the press was on its time, which seeks itself, or selected its text. Called
   * as a click bubbles to the segment.
   */
  pressSegment: (id: string, event: Event) => void;
  /** Reports what a person typed. Called as the Input's `input` bubbles to the search part. */
  read: (event: Event) => void;
  /** Writes the search into the Input once it has attached the controller. */
  syncQuery: () => void;
  /** "3 matches" while there's a search, else empty. */
  countText: (state: TranscriptState) => string;
  /** Hands the Input its props. Called by the search part. */
  searchState: () => TranscriptSearchState;
  /** The `value` of each of a segment's words: `"<segment id>/<index>"`, one for its whole text without words. */
  wordValues: (state: TranscriptState, id: string) => readonly string[];
  /** Each piece of a segment's text, split into what the search matched. */
  highlights: (state: TranscriptState, id: string) => { speaker: MatchSegment[]; words: MatchSegment[][] };
  /** Picks the segments in view and follows playback. Called by the viewport part. */
  bindViewport: (el: HTMLElement) => () => void;
  /** Measures a rendered segment, wherever the search puts it. Called by the segment part. */
  measureSegment: (el: HTMLElement, id: string) => () => void;
  /** Reads the page's language and lets later segments fade in. Called by the root part. */
  bindRoot: (el: HTMLElement) => () => void;
};

type SegmentProps = { value: string };
/** A word's `value` is `"<segment id>/<index>"`, as its segment's text part lists them. */
type WordProps = { value: string };

type TranscriptSlot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<TranscriptState, TranscriptApi, Props, Public>;

type ItemPartSlot<Public extends object = Record<never, never>> = TranscriptSlot<
  TranscriptItemPartProps & BaseSlotProps,
  Public
>;

type TranscriptSlots = {
  root: TranscriptSlot;
  search: TranscriptSlot<BaseSlotProps, TranscriptSearchState>;
  count: TranscriptSlot<BaseSlotProps, { text: string }>;
  viewport: TranscriptSlot;
  list: TranscriptSlot<BaseSlotProps, { rows: readonly VirtualItem[] }>;
  segment: TranscriptSlot<SegmentProps & BaseSlotProps, { canSeek: boolean }>;
  speaker: ItemPartSlot<{ speaker: MatchSegment[] }>;
  seek: ItemPartSlot;
  time: ItemPartSlot<{ time: string }>;
  text: ItemPartSlot<{ words: readonly string[] }>;
  word: TranscriptSlot<WordProps & BaseSlotProps, { text: MatchSegment[] }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type TranscriptPrimitive = ReturnType<
  typeof definePrimitive<TranscriptOptions, TranscriptState, TranscriptApi, TranscriptSlots>
>;

const NO_SEGMENTS: TranscriptSegment[] = [];
const NO_IDS: string[] = [];

const byId = (segments: TranscriptSegment[]) =>
  Object.fromEntries(segments.map((segment) => [segment.id, segment]));

const playing = (segments: TranscriptSegment[], time: number | undefined) => {
  const { segment, word } = time === undefined ? {} : currentAt(segments, time);
  return {
    currentSegment: segment ?? null,
    currentWord: segment !== undefined && word !== undefined ? `${segment}/${word}` : null,
  };
};

const presentation = (options: TranscriptOptions) => ({
  label: options.label ?? "Transcript",
  follow: options.follow ?? true,
  canSeek: options.onSeek !== undefined,
  locale: options.locale === undefined ? undefined : toLocale(options.locale),
  motion: options.motion ?? "auto",
});

const numberFormats = new Map<string, { plain: Intl.NumberFormat; padded: Intl.NumberFormat }>();

/** `seconds` as "1:05", or "1:02:05" past an hour, in the digits of `locale`. */
const formatTime = (seconds: number, locale: string): string => {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  let formats = numberFormats.get(locale);
  if (!formats) {
    formats = {
      plain: new Intl.NumberFormat(locale, { useGrouping: false }),
      padded: new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }),
    };
    numberFormats.set(locale, formats);
  }
  const { plain, padded } = formats;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor(whole / 60) % 60;
  const rest = padded.format(whole % 60);
  return hours > 0
    ? `${plain.format(hours)}:${padded.format(minutes)}:${rest}`
    : `${plain.format(minutes)}:${rest}`;
};

const segmentOf = (state: TranscriptState, id: string) =>
  Object.hasOwn(state.segmentsById, id) ? state.segmentsById[id] : undefined;

const timeLocale = (state: TranscriptState) => state.locale ?? state.pageLocale ?? "en-US";

const countText = ({ query, matches }: Pick<TranscriptState, "query" | "matches">) =>
  !query.trim() ? "" : matches === 0 ? "No matches" : matches === 1 ? "1 match" : `${matches} matches`;

// Until the viewport binds, the first segments, which the stylesheet stacks in the page's flow because their heights
// differ, so server markup shows them without overlap.
const SEGMENT_HEIGHT_GUESS = 72;
const firstRows = (shown: TranscriptSegment[]): VirtualItem[] =>
  shown.slice(0, 8).map((segment, index) => ({
    index,
    key: segment.id,
    start: index * SEGMENT_HEIGHT_GUESS,
    size: SEGMENT_HEIGHT_GUESS,
  }));

const samePiece = (a: MatchSegment[], b: MatchSegment[]) =>
  a.length === b.length &&
  a.every((part, index) => part.text === b[index]?.text && part.match === b[index]?.match);

const ownValue = ({ props }: { props: { value?: string } }) => (props.value ? [props.value] : NO_IDS);

const rowsMoved = (
  before: readonly VirtualItem[],
  after: readonly VirtualItem[],
  notify: (key: string) => void,
) => {
  const places = new Map(before.map((row) => [row.key, `${row.index}:${row.start}`]));
  for (const row of after) if (places.get(row.key) !== `${row.index}:${row.start}`) notify(row.key);
};

// Playback reaches only the segments and words it starts or stops, and a new segment only the parts of its own.
const ownSegment = selects<TranscriptState, TranscriptApi, SegmentProps>({
  segmentsById: ownValue,
  currentSegment: ownValue,
  entering: ownValue,
  rows: { values: ownValue, moved: rowsMoved },
  segments: [],
  shown: [],
  size: [],
  currentWord: [],
  focused: [],
  query: [],
  measured: [],
});

const ownPart = selects<TranscriptState, TranscriptApi, TranscriptItemPartProps>({
  segmentsById: ownValue,
  focused: [],
  segments: [],
  shown: [],
  matches: [],
  rows: [],
  size: [],
  currentSegment: [],
  currentWord: [],
  entering: [],
  measured: [],
});

const wordAt = (value: string) => {
  const at = value.lastIndexOf("/");
  return { id: value.slice(0, at), index: Number(value.slice(at + 1)) };
};

const ownWord = selects<TranscriptState, TranscriptApi, WordProps>({
  segmentsById: ({ props }) => [wordAt(props.value).id],
  currentWord: ({ props }) => [props.value],
  segments: [],
  shown: [],
  matches: [],
  rows: [],
  size: [],
  currentSegment: [],
  entering: [],
  focused: [],
  measured: [],
});

// The parts around the list read neither the segments nor playback.
const outsideList = selects<TranscriptState, TranscriptApi, BaseSlotProps>({
  segments: [],
  segmentsById: [],
  shown: [],
  rows: [],
  size: [],
  currentSegment: [],
  currentWord: [],
  entering: [],
  focused: [],
  measured: [],
});

const fromSegment = { value: { kind: "string", from: "segment" } } as const;

export const transcriptPrimitive: TranscriptPrimitive = definePrimitive<
  TranscriptOptions,
  TranscriptState,
  TranscriptApi,
  TranscriptSlots
>({
  name: "kind-transcript",
  options: {
    segments: "value",
    label: "string",
    currentTime: "number",
    onSeek: "callback",
    query: "string",
    defaultQuery: "string",
    onQueryChange: "callback",
    follow: "boolean",
    locale: "string",
    motion: "string",
  },
  state: (options) => {
    const segments = options.segments ?? NO_SEGMENTS;
    const query = options.query ?? options.defaultQuery ?? "";
    const shown = searchSegments(segments, query);
    return {
      ...presentation(options),
      ...playing(segments, options.currentTime),
      segments,
      segmentsById: byId(segments),
      query,
      shown,
      matches: shown.length,
      rows: firstRows(shown),
      size: shown.length * SEGMENT_HEIGHT_GUESS,
      measured: false,
      pageLocale: null,
      entering: NO_IDS,
      focused: null,
    };
  },
  // `segments` and `currentTime` reach state in `api`, which reads them again only when they change.
  sync: (options) => ({
    ...presentation(options),
    ...(options.query === undefined ? {} : { query: options.query }),
  }),
  controlled: ["query"],
  api: (context) => {
    const { store } = context;
    // `createChange` reads change reasons from the options type, which `context` widens.
    const change = createChange(context as PrimitiveContext<TranscriptOptions, TranscriptState, string>);
    const controller = createInputController();
    let mounting = true;
    let viewport: HTMLElement | undefined;
    let destroyed = false;
    let resync = 0;
    let clearEntering = 0;
    context.onDestroy(() => {
      destroyed = true;
      if (resync) cancelAnimationFrame(resync);
      if (clearEntering) cancelAnimationFrame(clearEntering);
    });

    const indexes = memo(
      (shown: TranscriptSegment[]) => new Map(shown.map((segment, index) => [segment.id, index])),
    );
    const indexOf = (id: string | null) => (id === null ? undefined : indexes(store.get().shown).get(id));

    const virtual = createVirtualizer({
      count: () => store.get().shown.length,
      key: (index) => store.get().shown[index]?.id ?? String(index),
      estimate: () => SEGMENT_HEIGHT_GUESS,
      // The segment holding the Tab stop stays rendered, so scrolling it away doesn't drop focus to the page.
      keep: () => {
        const index = indexOf(store.get().focused);
        return index === undefined ? [] : [index];
      },
    });
    virtual.subscribe(() => store.set({ rows: virtual.items(), size: virtual.size() }));

    const behavior = (): ScrollBehavior => {
      const reduced =
        typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      return resolveMotion(store.get().motion, reduced) === "full" ? "smooth" : "instant";
    };

    const followPlayback = () => {
      const { follow, currentSegment } = store.get();
      const index = indexOf(currentSegment);
      if (!follow || !viewport || index === undefined) return;
      // A reader focused inside, typing a search or moving through segments, keeps their place.
      if (context.element("root")?.matches(":focus-within")) return;
      virtual.scrollToIndex(index, { align: "center", behavior: behavior() });
    };

    let segmentsRead = store.get().segments;
    context.onOptions((options) => {
      const segments = options.segments ?? NO_SEGMENTS;
      const { currentTime } = options;
      if (segments !== segmentsRead) {
        const before = store.get().segmentsById;
        segmentsRead = segments;
        const segmentsById = byId(segments);
        // Web hosts can only set `segments` once the element exists, so the first frame's segments don't fade in.
        const entering = mounting
          ? NO_IDS
          : segments.filter((segment) => !Object.hasOwn(before, segment.id)).map(({ id }) => id);
        store.set({ segments, segmentsById, entering });
        if (entering.length > 0) {
          cancelAnimationFrame(clearEntering);
          clearEntering = requestAnimationFrame(() => store.set({ entering: NO_IDS }));
        }
      }
      const next = playing(segments, currentTime);
      const state = store.get();
      if (next.currentSegment !== state.currentSegment || next.currentWord !== state.currentWord)
        store.set(next);
    });

    let searched = { segments: store.get().segments, query: store.get().query };
    let wasPlaying = store.get().currentSegment;
    store.subscribe(() => {
      const { segments, query, currentSegment } = store.get();
      if (segments !== searched.segments || query !== searched.query) {
        const queryChanged = query !== searched.query;
        searched = { segments, query };
        const shown = searchSegments(segments, query);
        store.set({ shown, matches: shown.length });
        virtual.refresh();
        const text = countText({ query, matches: shown.length });
        if (queryChanged && text) announce(text, { priority: "polite" });
      }
      if (currentSegment !== wasPlaying) {
        wasPlaying = currentSegment;
        followPlayback();
      }
    });

    const syncQuery = () => {
      const { query } = store.get();
      // The controller reads `undefined` until the Input attaches it.
      const shown = controller.getValue() as string | undefined;
      if (shown !== undefined && shown !== query) controller.setValue(query);
    };
    store.subscribe(syncQuery);

    const searchState: TranscriptSearchState = {
      controller,
      defaultValue: store.get().query,
      label: "Search transcript",
    };
    const highlightCache = new WeakMap<
      TranscriptSegment,
      { query: string; speaker: MatchSegment[]; words: MatchSegment[][] }
    >();
    const noHighlights = { speaker: [], words: [] };
    const wordValueCache = new WeakMap<TranscriptSegment, readonly string[]>();

    const seek = (id: string, event?: Event) => {
      const segment = segmentOf(store.get(), id);
      if (!segment) return false;
      const details = event ? { reason: "segment-press" as const, event } : { reason: "imperative" as const };
      dispatch(context, "onSeek", segment.start, details);
      return true;
    };

    return {
      ...createListFocus<TranscriptState, TranscriptItemPartProps>(context, {
        slot: "seek",
        // Moves along every shown segment, not only those rendered, bringing the next into view first.
        move: (event, { from }) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return undefined;
          const { shown } = store.get();
          const index = indexOf(from.key) ?? -1;
          const to = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: shown.length - 1 }[event.key];
          if (to === undefined) return undefined;
          // At either end focus stays, and the key doesn't scroll the view.
          const target = shown[to];
          if (!target) return from.key;
          virtual.scrollToIndex(to);
          return target.id;
        },
      }),
      search: (text) => text === store.get().query || change("query", text, { reason: "imperative" }),
      getQuery: () => store.get().query,
      getSegments: () => store.get().segments,
      timeOf: (id) => {
        const state = store.get();
        const segment = segmentOf(state, id);
        return segment ? formatTime(segment.start, timeLocale(state)) : "";
      },
      get seek() {
        return store.get().canSeek ? seek : undefined;
      },
      pressSegment: (id, event) => {
        // The time's own press seeks, and a press that ends a text selection leaves playback where it is.
        const onTime = (event.target as Element).closest("[data-slot='kind-transcript-seek']");
        if (!store.get().canSeek || onTime || !document.getSelection()?.isCollapsed) return;
        seek(id, event);
      },
      read: (event) => {
        const next = (controller.getValue() as string | undefined) ?? "";
        if (next === store.get().query) return;
        // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next
        // frame: the Input holds its own value.
        if (!change("query", next, { reason: "input-change", event })) syncQuery();
        else if (context.options().query !== undefined) {
          cancelAnimationFrame(resync);
          resync = requestAnimationFrame(() => {
            if (!destroyed) syncQuery();
          });
        }
      },
      syncQuery,
      countText,
      searchState: () => searchState,
      wordValues: (state, id) => {
        const segment = segmentOf(state, id);
        return segment
          ? cached(wordValueCache, segment, () =>
              Array.from({ length: segment.words?.length ?? 1 }, (_, index) => `${id}/${index}`),
            )
          : NO_IDS;
      },
      highlights: (state, id) => {
        const segment = segmentOf(state, id);
        if (!segment) return noHighlights;
        const entry = highlightCache.get(segment);
        if (entry?.query === state.query) return entry;
        // Marked as the search scores them: the speaker apart from the words.
        const pieces = [
          ...highlightPieces([segment.speaker], state.query),
          ...highlightPieces(segmentPieces(segment), state.query),
        ];
        // A piece the search marks as it did keeps its array, so its word doesn't render again.
        const [speaker = [], ...words] = pieces.map((piece, index) => {
          const before = index === 0 ? entry?.speaker : entry?.words[index - 1];
          return before && samePiece(before, piece) ? before : piece;
        });
        const next = { query: state.query, speaker, words };
        highlightCache.set(segment, next);
        return next;
      },
      bindViewport: (el) => {
        viewport = el;
        const disconnect = virtual.connect(el);
        store.set({ rows: virtual.items(), size: virtual.size(), measured: true });
        followPlayback();
        return () => {
          disconnect();
          viewport = undefined;
        };
      },
      measureSegment: (el, id) => {
        let index = indexOf(id) ?? -1;
        const unmeasure = virtual.measure(index, el);
        // A search moves a segment to a new index while its element stays.
        const unsubscribe = store.subscribe(() => {
          const next = indexOf(id);
          if (next === undefined || next === index) return;
          index = next;
          virtual.measure(index, el);
        });
        return () => {
          unsubscribe();
          unmeasure();
        };
      },
      bindRoot: (el) => {
        const release = holdTransitions(el);
        store.set({ pageLocale: toLocale(pageLocale(el) ?? "") ?? null });
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        return () => {
          release();
          cancelAnimationFrame(frame);
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "region",
      selects: outsideList,
      attrs: (state) => ({ "aria-label": state.label, "data-motion": state.motion }),
      bind: (el, { api }) => api.bindRoot(el),
    }),
    search: slot<BaseSlotProps, TranscriptSearchState>({
      selects: outsideList,
      state: (_state, { api }) => api.searchState(),
      // UI SDK skips the `input` events of an input method's composition, so the search runs once it commits.
      on: {
        input: (event, { api }) => api.read(event),
        compositionend: (event, { api }) => api.read(event),
      },
      bind: (_el, { api }) => api.syncQuery(),
    }),
    count: slot<BaseSlotProps, { text: string }>({
      selects: outsideList,
      present: (state) => state.query.trim() !== "",
      state: (state) => ({ text: countText(state) }),
    }),
    viewport: slot({
      selects: outsideList,
      // A tab stop, so the keyboard can scroll it in every browser, as UI SDK Scroll Area's viewport is.
      focus: "tab-stop",
      attrs: () => ({ tabindex: "0" }),
      bind: (el, { api }) => api.bindViewport(el),
    }),
    list: slot<BaseSlotProps, { rows: readonly VirtualItem[] }>({
      role: "list",
      selects: selects<TranscriptState, TranscriptApi, BaseSlotProps>({
        segments: [],
        segmentsById: [],
        currentSegment: [],
        currentWord: [],
        entering: [],
        focused: [],
      }),
      state: (state) => ({ rows: state.rows }),
      attrs: (state) => ({
        "aria-label": state.label,
        "data-measured": state.measured ? "" : undefined,
        style: css({ "--kind-transcript-size": `${state.size}px` }),
      }),
    }),
    segment: slot<SegmentProps, { canSeek: boolean }>({
      role: "listitem",
      props: { value: "string" },
      selects: ownSegment,
      state: (state) => ({ canSeek: state.canSeek }),
      // Playback writes these straight to the element, so it doesn't render the segment and its words again.
      direct: direct(["aria-current"]),
      attrs: (state, { key }) => {
        const row = state.rows.find((item) => item.key === key);
        return {
          "aria-current": state.currentSegment === key ? "true" : undefined,
          "aria-setsize": String(state.matches),
          "aria-posinset": row ? String(row.index + 1) : undefined,
          "data-entering": state.entering.includes(key) ? "" : undefined,
          "data-can-seek": state.canSeek ? "" : undefined,
          style: css({ "--kind-transcript-segment-start": row ? `${row.start}px` : undefined }),
        };
      },
      on: { click: (event, { api, key }) => api.pressSegment(key, event) },
      bind: (el, { api, key }) => api.measureSegment(el, key),
    }),
    speaker: slot<TranscriptItemPartProps & BaseSlotProps, { speaker: MatchSegment[] }>({
      props: fromSegment,
      selects: ownPart,
      state: (state, { api, key }) => ({ speaker: api.highlights(state, key).speaker }),
    }),
    seek: slot<TranscriptItemPartProps & BaseSlotProps>({
      role: "button",
      focus: "roving",
      props: fromSegment,
      selects: selects<TranscriptState, TranscriptApi, TranscriptItemPartProps>({
        segmentsById: ownValue,
        focused: ({ key }) => [key, null],
        segments: [],
        shown: [],
        matches: [],
        rows: [],
        size: [],
        currentSegment: [],
        currentWord: [],
        entering: [],
        query: [],
      }),
      present: (state) => state.canSeek,
      press: ({ api, key }, event) => api.seek?.(key, event),
      attrs: (state, part) => {
        const segment = segmentOf(state, part.key);
        return {
          type: "button",
          "aria-label": segment ? `Seek to ${formatTime(segment.start, timeLocale(state))}` : undefined,
          tabindex: part.api.roving.tabIndex(state, part),
        };
      },
      on: {
        keydown: (event, { el, api }) => {
          if (el) api.roving.keydown(event as KeyboardEvent, el);
        },
      },
      bind: (el, part) => {
        const unbindFocus = part.api.roving.bind(el, part);
        const unbindRecovery = part.api.recovery.bind(el, part);
        return () => {
          unbindFocus();
          unbindRecovery();
        };
      },
    }),
    time: slot<TranscriptItemPartProps & BaseSlotProps, { time: string }>({
      props: fromSegment,
      selects: ownPart,
      state: (state, { key }) => {
        const segment = segmentOf(state, key);
        return { time: segment ? formatTime(segment.start, timeLocale(state)) : "" };
      },
    }),
    text: slot<TranscriptItemPartProps & BaseSlotProps, { words: readonly string[] }>({
      props: fromSegment,
      selects: ownPart,
      state: (state, { api, key }) => ({ words: api.wordValues(state, key) }),
    }),
    word: slot<WordProps, { text: MatchSegment[] }>({
      props: { value: "string" },
      selects: ownWord,
      state: (state, { api, key }) => {
        const { id, index } = wordAt(key);
        return { text: api.highlights(state, id).words[index] ?? [] };
      },
      direct: direct(["data-current"]),
      attrs: (state, { key }) => ({ "data-current": state.currentWord === key ? "" : undefined }),
    }),
  }),
  // Segments are listed by speaker and time, so an agent can name one to `seek`. They aren't closed, because `search`
  // takes any text, and the bridge would check it against them.
  agent: {
    actions: ["search", "seek"],
    items: (api: TranscriptApi) =>
      api.getSegments().map((segment) => ({
        value: segment.id,
        label: `${segment.speaker}, ${api.timeOf(segment.id)}`,
      })),
  },
});
