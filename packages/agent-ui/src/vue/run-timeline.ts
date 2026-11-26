import {
  type RunTimelineEndState,
  type RunTimelineEntry,
  type RunTimelineRootState,
  type RunTimelineTimeState,
  type RunTimelineTitleState,
  runTimelinePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type PropType, type Slots, type VNodeChild } from "vue";
import {
  KindTimeline,
  KindTimelineConnector,
  KindTimelineDescription,
  KindTimelineItem,
  KindTimelineMarker,
  KindTimelineTime,
  KindTimelineTitle,
} from "./internal/timeline.js";
import { Markdown } from "./markdown.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onLoadMore`, whose presence offers Show earlier, is declared a function prop instead, which `@load-more` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => runTimelinePrimitive(options), runTimelinePrimitive, {
    options: { ...runTimelinePrimitive.options, onLoadMore: "action" },
  }),
  "name",
  { value: runTimelinePrimitive.name },
) as typeof runTimelinePrimitive;

const parts = createParts(primitive, {
  root: "div",
  item: "div",
  marker: "span",
  title: "span",
  time: "span",
  actor: "span",
  description: "div",
  end: "div",
  more: "button",
});

// A part with default children, unless the host passes its own default slot. Slot state is a proxy that answers
// reads, so the children read each key they need.
const withDefault = <Part extends object, State>(
  name: string,
  part: Part,
  children: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? children } as Slots);
    },
  }) as unknown as Part;

const loading = () => [
  h("span", { "data-status-mark": "", "data-status": "running", "aria-hidden": "true" }),
  "Loading",
];

export const RunTimelineItem = parts.Item;

/** The event's status mark, or a dot without a status. */
export const RunTimelineMarker = parts.Marker;

/** The event's `title`, then its status in words for screen readers, unless you fill the default slot. */
export const RunTimelineTitle = withDefault(
  "RunTimelineTitle",
  parts.Title,
  ({ state }: { state: RunTimelineTitleState }) => {
    const status = state.status;
    return [state.title, status ? h("span", { "data-run-timeline-status": "" }, ` (${status})`) : null];
  },
);

/** When it happened: its time today, else its date too. Server markup shows the date. */
export const RunTimelineTime = withDefault(
  "RunTimelineTime",
  parts.Time,
  ({ state }: { state: RunTimelineTimeState }) => state.label,
);

/** Who did it, unless you fill the default slot. Rendered only with an `actor`. */
export const RunTimelineActor = withDefault(
  "RunTimelineActor",
  parts.Actor,
  ({ state }: { state: { name: string } }) => state.name,
);

/** The event's `description` as Markdown, unless you fill the default slot. Rendered only with one. */
export const RunTimelineDescription = withDefault(
  "RunTimelineDescription",
  parts.Description,
  ({ state }: { state: { description: string } }) => h(Markdown, { source: state.description }),
);

/** Calls `onLoadMore`. Reads "Loading", and does nothing, while `busy`. */
export const RunTimelineMore = withDefault(
  "RunTimelineMore",
  parts.More,
  ({ state }: { state: { busy: boolean } }) => (state.busy ? loading() : "Show earlier"),
);

/** Show earlier while `hasMore`, else "Loading" while `busy`. */
export const RunTimelineEnd = withDefault(
  "RunTimelineEnd",
  parts.End,
  ({ state }: { state: RunTimelineEndState }) => (state.canLoadMore ? h(RunTimelineMore) : loading()),
);

// The connector is hidden from agents, which hides UI SDK's Timeline from them (a component with a part under
// `data-agent-hidden` is off limits) while the events stay the Run Timeline's.
/**
 * One event: a Timeline item holding its marker, title, time, actor and description. A Vue component updates only
 * when its props change, and an event that didn't change keeps its `entry`, as React's `memo` does.
 */
export const RunTimelineEvent = defineComponent({
  name: "RunTimelineEvent",
  props: {
    value: { type: String, required: true },
    entry: { type: Object as PropType<RunTimelineEntry>, required: true },
  },
  setup(props) {
    return () => {
      const { value, entry } = props;
      return h(parts.Item, { value }, () =>
        h(KindTimelineItem, { value, status: entry.current ? "current" : undefined }, () => [
          h(KindTimelineMarker, null, () => h(RunTimelineMarker)),
          h(KindTimelineConnector, { "data-agent-hidden": "" }),
          h(KindTimelineTitle, null, () => h(RunTimelineTitle)),
          h(KindTimelineTime, { datetime: entry.at }, () => h(RunTimelineTime)),
          entry.actor || entry.description
            ? h(KindTimelineDescription, null, () => [h(RunTimelineActor), h(RunTimelineDescription)])
            : null,
        ]),
      );
    };
  },
});

/** A `RunTimelineEvent` for each row. */
export const RunTimelineEvents = defineComponent({
  name: "RunTimelineEvents",
  props: {
    rows: { type: Array as PropType<string[]>, required: true },
    entries: { type: Object as PropType<Record<string, RunTimelineEntry>>, required: true },
  },
  setup(props) {
    return () =>
      props.rows.map((id) =>
        h(RunTimelineEvent, { key: id, value: id, entry: props.entries[id] as RunTimelineEntry }),
      );
  },
});

/**
 * A run's events in time order, on UI SDK's Timeline: a list with one Tab stop that Up and Down move through, or a
 * feed of articles with `feed`. Show earlier sits before the oldest event while `hasMore` and `@load-more` is bound.
 * A default slot replaces the events inside the Timeline; `RunTimelineEvents` draws them.
 */
export const RunTimeline = defineComponent({
  name: "RunTimeline",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        default: ({ state }: { state: RunTimelineRootState }) => {
          const { label, feed, busy, order, rows, entries } = state;
          return [
            order === "oldest-first" ? h(RunTimelineEnd) : null,
            h(KindTimeline, { "aria-label": label, feed, busy }, () =>
              slots.default ? slots.default() : h(RunTimelineEvents, { rows, entries }),
            ),
            order === "newest-first" ? h(RunTimelineEnd) : null,
          ];
        },
      });
  },
}) as unknown as typeof parts.Root;
