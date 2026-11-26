import {
  type ActivityGraphGridState,
  type ActivityGraphLabelState,
  type ActivityGraphLegendState,
  type ActivityGraphMonthsState,
  type ActivityGraphSummaryState,
  activityGraphPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type Slots, type VNodeChild } from "vue";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onSelect`, whose presence makes the days choosable, is declared a function prop instead, which `@select` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => activityGraphPrimitive(options), activityGraphPrimitive, {
    options: { ...activityGraphPrimitive.options, onSelect: "action" },
  }),
  "name",
  { value: activityGraphPrimitive.name },
) as typeof activityGraphPrimitive;

const parts = createParts(primitive, {
  root: "div",
  viewport: "div",
  grid: "div",
  months: "div",
  month: "span",
  row: "div",
  weekday: "div",
  cell: "div",
  legend: "div",
  swatch: "span",
  summary: "p",
});

// A part with default children, unless the host passes its own default slot.
const withDefault = <Part extends object>(
  name: string,
  part: Part,
  children: (scope: { state: never }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? children } as Slots);
    },
  }) as unknown as Part;

const label = ({ state }: { state: ActivityGraphLabelState }) => state.label;

/** A month's short name over the week column its `value` names. */
export const ActivityGraphMonth = withDefault("ActivityGraphMonth", parts.Month, label);

/** The months over their first week, hidden from assistive technology, which reads each day's date. */
export const ActivityGraphMonths = withDefault(
  "ActivityGraphMonths",
  parts.Months,
  ({ state }: { state: ActivityGraphMonthsState }) =>
    state.months.map((month) => h(ActivityGraphMonth, { key: month.value, value: month.value })),
);

/** A weekday's row, by its index from the week's first day. */
export const ActivityGraphRow = parts.Row;

/** The row's header: the weekday's short name. */
export const ActivityGraphWeekday = withDefault("ActivityGraphWeekday", parts.Weekday, label);

/** A day, by its weekday `row` and week `col`, named by its count and date. */
export const ActivityGraphCell = parts.Cell;

/** The days: the month labels over the weeks, then a row per weekday, its name and its days. */
export const ActivityGraphGrid = withDefault(
  "ActivityGraphGrid",
  parts.Grid,
  ({ state }: { state: ActivityGraphGridState }) => [
    h(ActivityGraphMonths),
    ...state.rows.map((row) =>
      h(ActivityGraphRow, { key: row.value, value: row.value }, () => [
        h(ActivityGraphWeekday, { value: row.value }),
        ...row.cells.map((cell) =>
          h(ActivityGraphCell, { key: cell.value, value: cell.value, row: cell.row, col: cell.col }),
        ),
      ]),
    ),
  ],
);

/** Scrolls the grid sideways when it doesn't fit, starting at the latest week. Holds the grid unless you fill its slot. */
export const ActivityGraphViewport = withDefault("ActivityGraphViewport", parts.Viewport, () =>
  h(ActivityGraphGrid),
);

/** A level's shade, by its `value` from 0. */
export const ActivityGraphSwatch = parts.Swatch;

/** "Less", a swatch per level, "More". Hidden from assistive technology, which reads each day's count. */
export const ActivityGraphLegend = withDefault(
  "ActivityGraphLegend",
  parts.Legend,
  ({ state }: { state: ActivityGraphLegendState }) => [
    h("span", state.less),
    ...state.levels.map((level) => h(ActivityGraphSwatch, { key: level.value, value: level.value })),
    h("span", state.more),
  ],
);

/** The total in words, like "812 runs in the last year", which describes the grid. Visually hidden. */
export const ActivityGraphSummary = withDefault(
  "ActivityGraphSummary",
  parts.Summary,
  ({ state }: { state: ActivityGraphSummaryState }) => state.text,
);

/**
 * A calendar heat map of how much happened each day: weekdays down, weeks across, ending with today's. One Tab stop;
 * the arrows move by day and week, and Enter calls `@select`. Anything in its default slot replaces its parts.
 */
export const ActivityGraph = withDefault("ActivityGraph", parts.Root, () => [
  h(ActivityGraphViewport),
  h(ActivityGraphLegend),
  h(ActivityGraphSummary),
]);
