import { type TranscriptSearchState, transcriptPrimitive } from "@kind-ui/agent-ui/core";
import { Input, InputClear, InputGroup } from "@ui-sdk/vue/input";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, Fragment, h, type Slots } from "vue";

type MatchSegment = { text: string; match: boolean };

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onSeek`, whose presence makes each time a button, is declared a function prop instead, which `@seek` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => transcriptPrimitive(options), transcriptPrimitive, {
    options: { ...transcriptPrimitive.options, onSeek: "action" },
  }),
  "name",
  { value: transcriptPrimitive.name },
) as typeof transcriptPrimitive;

const parts = createParts(primitive, {
  root: "div",
  search: "div",
  count: "span",
  viewport: "div",
  list: "div",
  segment: "div",
  speaker: "span",
  seek: "button",
  time: "span",
  text: "p",
  word: "span",
});

// `$stable` tells Vue these slots never change, so a part that renders again doesn't render the parts inside it.
const stable = (slot: () => unknown) => ({ default: slot, $stable: true });

// A part that fills an empty default slot from its state.
const withDefault = <Part>(part: Part, name: string, fill: (state: never) => unknown) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(part as never, attrs, {
          ...slots,
          default: slots.default ?? (({ state }: { state: never }) => fill(state)),
        });
    },
  }) as unknown as Part;

const marked = (segments: readonly MatchSegment[]) =>
  segments.map((segment, index) => (segment.match ? h("mark", { key: index }, segment.text) : segment.text));

/** A time as a button that seeks to its segment, rendered only while `on-seek` is set. Holds a `TranscriptTime`. */
export const TranscriptSeek = parts.Seek;
/** Scrolls the segments. Holds a `TranscriptList`. */
export const TranscriptViewport = parts.Viewport;

/** "3 matches" while there's a search, unless you fill the default slot. */
export const TranscriptCount = withDefault(
  parts.Count,
  "TranscriptCount",
  (state: { text: string }) => state.text,
);

/**
 * A search field with the match count and a clear button, unless you fill the default slot. Pass the state to UI SDK
 * Input.
 */
export const TranscriptSearch = withDefault(
  parts.Search,
  "TranscriptSearch",
  (state: TranscriptSearchState) =>
    h(InputGroup, null, () => [
      h(Input, {
        type: "search",
        controller: state.controller,
        defaultValue: state.defaultValue,
        "aria-label": state.label,
        placeholder: "Search",
        "data-agent-hidden": "",
      }),
      h(TranscriptCount),
      h(InputClear, { "aria-label": "Clear search", "data-agent-hidden": "" }),
    ]),
);

/** The speaker, with what the search matched marked, unless you fill the default slot. */
export const TranscriptSpeaker = withDefault(
  parts.Speaker,
  "TranscriptSpeaker",
  (state: { speaker: readonly MatchSegment[] }) => marked(state.speaker),
);

/** When the segment starts, like "1:05", unless you fill the default slot. */
export const TranscriptTime = withDefault(
  parts.Time,
  "TranscriptTime",
  (state: { time: string }) => state.time,
);

/**
 * The word whose `value` is `"<segment id>/<index>"`, or a segment's whole text without words, with what the search
 * matched marked, unless you fill the default slot. Playback writes its mark without rendering it.
 */
export const TranscriptWord = withDefault(
  parts.Word,
  "TranscriptWord",
  (state: { text: readonly MatchSegment[] }) => marked(state.text),
);

/**
 * A `TranscriptWord` for each of the segment's words, a space apart, or its whole text, unless you fill the default
 * slot.
 */
export const TranscriptText = withDefault(
  parts.Text,
  "TranscriptText",
  (state: { words: readonly string[] }) =>
    state.words.map((value, index) =>
      h(Fragment, { key: value }, [index > 0 ? " " : null, h(TranscriptWord, { value })]),
    ),
);

const seekTime = stable(() => h(TranscriptTime));

/**
 * The segment whose id is `value`: its speaker, its time, and its text, unless you fill the default slot. A segment
 * renders again only when its own parts change, since Vue renders a child again only when its props do.
 */
export const TranscriptSegment = withDefault(
  parts.Segment,
  "TranscriptSegment",
  (state: { canSeek: boolean }) => [
    h("div", { "data-transcript-header": "" }, [
      h(TranscriptSpeaker),
      state.canSeek ? h(TranscriptSeek, null, seekTime) : h(TranscriptTime),
    ]),
    h(TranscriptText),
  ],
);

/** A `TranscriptSegment` for each segment in view, unless you fill the default slot. */
export const TranscriptList = withDefault(
  parts.List,
  "TranscriptList",
  (state: { rows: readonly { key: string }[] }) =>
    state.rows.map((row) => h(TranscriptSegment, { key: row.key, value: row.key })),
);

const defaultParts = () => [
  h(TranscriptSearch),
  h(
    TranscriptViewport,
    null,
    stable(() => h(TranscriptList)),
  ),
];

/**
 * Speaker-labelled, timed segments with a search, marking the segment and word playing at `current-time`. A default
 * slot replaces the default parts.
 */
export const Transcript = defineComponent({
  name: "Transcript",
  inheritAttrs: false,
  setup(_, { attrs, slots }: { attrs: Record<string, unknown>; slots: Slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
