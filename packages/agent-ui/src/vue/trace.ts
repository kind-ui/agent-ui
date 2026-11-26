import {
  type TraceDetailsState,
  type TraceEntry,
  type TraceRow as TraceRowData,
  type TraceViewportState,
  tracePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, Fragment, h, type PropType } from "vue";
import {
  KindWaterfall,
  KindWaterfallAxis,
  KindWaterfallBar,
  KindWaterfallCell,
  KindWaterfallColumnHeader,
  KindWaterfallHeaderRow,
  KindWaterfallIndicator,
  KindWaterfallRow,
  KindWaterfallRowHeader,
} from "./internal/waterfall.js";

const parts = createParts(tracePrimitive, {
  root: "div",
  viewport: "div",
  axis: "div",
  name: "span",
  status: "span",
  duration: "span",
  bar: "span",
  details: "div",
  "details-close": "button",
});

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const chevron = () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "aria-hidden": "true",
    },
    [h("path", { d: "m9 18 6-6-6-6", "stroke-linecap": "round", "stroke-linejoin": "round" })],
  );

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

/** A span's status mark, named by its status. */
export const TraceStatus = parts.Status;

/** A span's bar on the time axis. */
export const TraceBar = parts.Bar;

/** The ruler above the bars, which holds UI SDK's axis. */
export const TraceAxis = parts.Axis;

/** Deselects the span and returns focus to its row. Its icon is drawn in CSS; render it empty. */
export const TraceDetailsClose = parts.DetailsClose;

/** A span's kind glyph, name and status mark, unless you fill the default slot. */
export const TraceName = withDefault(parts.Name, "TraceName", (state: TraceEntry) => [
  h("span", { "data-trace-label": "" }, state.name),
  " ",
  h(TraceStatus, { value: state.id }),
]);

/** How long a span took, or has run so far, unless you fill the default slot. */
export const TraceDuration = withDefault(
  parts.Duration,
  "TraceDuration",
  (state: { text: string }) => state.text,
);

/**
 * A Waterfall row for a span: its name, duration and bar. A row renders again only when core gives it a new row,
 * since Vue renders a child again only when its props change.
 */
export const TraceRow = defineComponent({
  name: "TraceRow",
  props: { row: { type: Object as PropType<TraceRowData>, required: true } },
  setup(props) {
    return () => {
      const { row } = props;
      return h(
        KindWaterfallRow,
        {
          value: row.props.value,
          "aria-rowindex": row.props["aria-rowindex"],
          style: { top: `${row.top}px` },
        },
        stable(() => [
          h(
            KindWaterfallRowHeader,
            null,
            stable(() => [
              row.branch
                ? h(KindWaterfallIndicator, null, stable(chevron))
                : h("span", { "data-trace-spacer": "" }),
              h(TraceName, { value: row.key }),
            ]),
          ),
          h(
            KindWaterfallCell,
            null,
            stable(() => h(TraceDuration, { value: row.key })),
          ),
          h(
            KindWaterfallBar,
            null,
            stable(() => h(TraceBar, { value: row.key })),
          ),
        ]),
      );
    };
  },
});

/**
 * The scroller around the Waterfall, with its header row and the rows in view, each placed at its offset, unless you
 * fill the default slot. The axis is hidden from agents, which hides UI SDK's Waterfall from them while the rows stay
 * the Trace's.
 */
export const TraceViewport = withDefault(
  parts.Viewport,
  "TraceViewport",
  ({ waterfall, rows, height }: TraceViewportState) =>
    // The slot's state is a proxy that lists no keys, so the Waterfall's props are read one by one.
    h(
      KindWaterfall,
      {
        controller: waterfall.controller,
        items: waterfall.items,
        range: waterfall.range,
        locale: waterfall.locale,
        getBarLabel: waterfall.getBarLabel,
        defaultValue: waterfall.defaultValue,
        defaultExpanded: waterfall.defaultExpanded,
        onValueChange: waterfall.onValueChange,
        onExpandedChange: waterfall.onExpandedChange,
        onHighlight: waterfall.onHighlight,
        "aria-label": waterfall["aria-label"],
        "aria-rowcount": waterfall["aria-rowcount"],
        style: { height: `${height}px` },
      },
      () => [
        h(
          KindWaterfallHeaderRow,
          { "aria-rowindex": 1 },
          stable(() => [
            h(
              KindWaterfallColumnHeader,
              null,
              stable(() => "Name"),
            ),
            h(
              KindWaterfallColumnHeader,
              null,
              stable(() => "Duration"),
            ),
            h(
              KindWaterfallColumnHeader,
              null,
              stable(() => [
                h("span", { class: "sr-only" }, "Timeline"),
                h(
                  TraceAxis,
                  null,
                  stable(() => h(KindWaterfallAxis, { "data-agent-hidden": "", maxTicks: 5 })),
                ),
              ]),
            ),
          ]),
        ),
        ...rows.map((row) => h(TraceRow, { key: row.key, row })),
      ],
    ),
);

/** The selected span's name, kind, status, start, duration and attributes, with Close, unless you fill the default slot. */
export const TraceDetails = withDefault(
  parts.Details,
  "TraceDetails",
  ({ name, rows }: TraceDetailsState) => [
    h("div", { "data-trace-details-header": "" }, [
      h("p", { "data-trace-details-title": "" }, name),
      h(TraceDetailsClose),
    ]),
    h(
      "dl",
      null,
      rows.map(({ term, detail }) =>
        h(Fragment, { key: term }, [h("dt", null, term), h("dd", null, detail)]),
      ),
    ),
  ],
);

/**
 * A trace as UI SDK Waterfall: every span a row with its kind, status, duration and bar on one time axis, nested
 * spans that expand, and the selected span's details below. Only the rows in view render. A default slot replaces
 * the viewport and details.
 */
export const Trace = defineComponent({
  name: "Trace",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: slots.default ?? (() => [h(TraceViewport), h(TraceDetails)]),
      });
  },
}) as unknown as typeof parts.Root;
