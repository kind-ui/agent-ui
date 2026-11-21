import { type StackTraceRow, type StackTraceState, stackTracePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNode } from "vue";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onOpenFrame`, whose presence makes each frame a button, is declared a function prop instead, which `@open-frame`
// binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => stackTracePrimitive(options), stackTracePrimitive, {
    options: { ...stackTracePrimitive.options, onOpenFrame: "action" },
  }),
  "name",
  { value: stackTracePrimitive.name },
) as typeof stackTracePrimitive;

// `$stable` tells Vue these slots never change, so a part that renders again doesn't render the parts inside it.
const stable = (slot: () => unknown) => ({ default: slot, $stable: true });

const parts = createParts(primitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  content: "div",
  message: "div",
  copy: "button",
  list: "ol",
  frame: "li",
  "frame-open": "button",
  "frame-function": "span",
  "frame-location": "span",
  group: "li",
  library: "button",
  "library-frames": "ol",
});

// Slot state is a proxy that answers reads, so fallbacks read each key they need.
type PartState = StackTraceState & {
  text: string;
  fn: string;
  location: string;
  count: number;
  indexes: number[];
};

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component>(part: C, name: string, fallback: (state: PartState) => unknown) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill });
    },
  }) as unknown as C;
}

export const StackTraceTrigger = parts.Trigger;
export const StackTraceIcon = parts.Icon;
export const StackTraceContent = parts.Content;
export const StackTraceCopy = parts.Copy;
/** The frame's function and location as a button, rendered only while `onOpenFrame` is set. */
export const StackTraceFrameOpen = parts.FrameOpen;

/** The `label`, else the message's first line with the error's name set apart, unless you fill the default slot. */
export const StackTraceTitle = withDefault(parts.Title, "StackTraceTitle", (state) => {
  const { name, summary } = state;
  return name ? [h("span", { "data-stack-trace-name": "" }, name), `: ${summary}`] : summary;
});

/** The message's lines after its first, unless you fill the default slot. Rendered only while there are any. */
export const StackTraceMessage = withDefault(parts.Message, "StackTraceMessage", (state) => state.text);

/** The frame's function, unless you fill the default slot. */
export const StackTraceFrameFunction = withDefault(
  parts.FrameFunction,
  "StackTraceFrameFunction",
  (state) => state.fn,
);

/** The frame's file, shortened to its last two segments, with line and column, unless you fill the default slot. */
export const StackTraceFrameLocation = withDefault(
  parts.FrameLocation,
  "StackTraceFrameLocation",
  (state) => state.location,
);

const frameText = () => [h(StackTraceFrameFunction), h(StackTraceFrameLocation)];

/**
 * The frame whose index is `value`. Without a default slot, it shows the frame's function and location, inside a
 * `StackTraceFrameOpen` while `on-open-frame` is set.
 */
export const StackTraceFrame = withDefault(parts.Frame, "StackTraceFrame", (state) =>
  state.canOpen ? h(StackTraceFrameOpen, null, frameText) : frameText(),
);

/** Shows or folds library frames. "N library frames", unless you fill the default slot. */
export const StackTraceLibrary = withDefault(parts.Library, "StackTraceLibrary", (state) => {
  const count = state.count;
  return `${count} library ${count === 1 ? "frame" : "frames"}`;
});

/** A group's frames, which open in place, unless you fill the default slot. */
export const StackTraceLibraryFrames = withDefault(parts.LibraryFrames, "StackTraceLibraryFrames", (state) =>
  state.indexes.map((index) => h(StackTraceFrame, { key: index, value: String(index) })),
);

/**
 * The library frames that start at the index `value`, folded into one row. Without a default slot, it shows a
 * `StackTraceLibrary` toggle and the frames.
 */
export const StackTraceGroup = withDefault(parts.Group, "StackTraceGroup", () => [
  h(StackTraceLibrary),
  h(StackTraceLibraryFrames),
]);

/** A frame for each app frame and a group for each run of library frames, unless you fill the default slot. */
export const StackTraceList = withDefault(parts.List, "StackTraceList", (state) =>
  state.rows.map((row: StackTraceRow) =>
    row.type === "frame"
      ? h(StackTraceFrame, { key: row.index, value: String(row.index) })
      : h(StackTraceGroup, { key: `library-${row.start}`, value: String(row.start) }),
  ),
);

/**
 * An error as a step: its name and message, then its frames, with consecutive library frames folded into one row.
 * A default slot replaces the default parts.
 */
export const StackTrace = withDefault(parts.Root, "StackTrace", () => [
  h(
    StackTraceTrigger,
    null,
    stable(() => [h(StackTraceIcon), h(StackTraceTitle)]),
  ),
  h(
    StackTraceContent,
    null,
    stable(() =>
      h("div", { "data-stack-trace-panel": "", "data-kind-code": "" }, [
        h(StackTraceMessage),
        h(StackTraceList),
        h(StackTraceCopy),
      ]),
    ),
  ),
]);
