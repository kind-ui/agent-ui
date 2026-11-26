import {
  type ActivityGraphGridState,
  type ActivityGraphLabelState,
  type ActivityGraphLegendState,
  type ActivityGraphMonthsState,
  type ActivityGraphSummaryState,
  activityGraphPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

const parts = createParts(activityGraphPrimitive, {
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

export type ActivityGraphProps = ComponentProps<typeof parts.Root>;

/**
 * A calendar heat map of how much happened each day: weekdays down, weeks across, ending with today's. One Tab stop;
 * the arrows move by day and week, and Enter calls `onSelect`. Any `children` replace its parts.
 */
export function ActivityGraph(props: ActivityGraphProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ActivityGraphViewport />
          <ActivityGraphLegend />
          <ActivityGraphSummary />
        </>
      )}
    </parts.Root>
  );
}

export type ActivityGraphViewportProps = ComponentProps<typeof parts.Viewport>;

/** Scrolls the grid sideways when it doesn't fit, starting at the latest week. Holds the grid unless you pass children. */
export function ActivityGraphViewport(props: ActivityGraphViewportProps) {
  return (
    <parts.Viewport {...omit(props, "children")}>{props.children ?? <ActivityGraphGrid />}</parts.Viewport>
  );
}

export type ActivityGraphGridProps = ComponentProps<typeof parts.Grid>;

/** The days: the month labels over the weeks, then a row per weekday, its name and its days. */
export function ActivityGraphGrid(props: ActivityGraphGridProps) {
  return (
    <parts.Grid {...omit(props, "children")}>
      {props.children ??
        ((state: ActivityGraphGridState) => (
          <>
            <ActivityGraphMonths />
            <For each={state.rows} keyed={(row) => row.value}>
              {(row) => (
                <ActivityGraphRow value={row().value}>
                  <ActivityGraphWeekday value={row().value} />
                  <For each={row().cells} keyed={(cell) => cell.value}>
                    {(cell) => <ActivityGraphCell value={cell().value} row={cell().row} col={cell().col} />}
                  </For>
                </ActivityGraphRow>
              )}
            </For>
          </>
        ))}
    </parts.Grid>
  );
}

export type ActivityGraphMonthsProps = ComponentProps<typeof parts.Months>;

/** The months over their first week, hidden from assistive technology, which reads each day's date. */
export function ActivityGraphMonths(props: ActivityGraphMonthsProps) {
  return (
    <parts.Months {...omit(props, "children")}>
      {props.children ??
        ((state: ActivityGraphMonthsState) => (
          <For each={state.months} keyed={(month) => month.value}>
            {(month) => <ActivityGraphMonth value={month().value} />}
          </For>
        ))}
    </parts.Months>
  );
}

export type ActivityGraphMonthProps = ComponentProps<typeof parts.Month>;

/** A month's short name over the week column its `value` names. */
export function ActivityGraphMonth(props: ActivityGraphMonthProps) {
  return (
    <parts.Month {...omit(props, "children")}>
      {props.children ?? ((state: ActivityGraphLabelState) => state.label)}
    </parts.Month>
  );
}

export type ActivityGraphRowProps = ComponentProps<typeof parts.Row>;

/** A weekday's row, by its index from the week's first day. */
export function ActivityGraphRow(props: ActivityGraphRowProps) {
  return <parts.Row {...props} />;
}

export type ActivityGraphWeekdayProps = ComponentProps<typeof parts.Weekday>;

/** The row's header: the weekday's short name. */
export function ActivityGraphWeekday(props: ActivityGraphWeekdayProps) {
  return (
    <parts.Weekday {...omit(props, "children")}>
      {props.children ?? ((state: ActivityGraphLabelState) => state.label)}
    </parts.Weekday>
  );
}

export type ActivityGraphCellProps = ComponentProps<typeof parts.Cell>;

/** A day, by its weekday `row` and week `col`, named by its count and date. */
export function ActivityGraphCell(props: ActivityGraphCellProps) {
  return <parts.Cell {...props} />;
}

export type ActivityGraphLegendProps = ComponentProps<typeof parts.Legend>;

/** "Less", a swatch per level, "More". Hidden from assistive technology, which reads each day's count. */
export function ActivityGraphLegend(props: ActivityGraphLegendProps) {
  return (
    <parts.Legend {...omit(props, "children")}>
      {props.children ??
        ((state: ActivityGraphLegendState) => (
          <>
            <span>{state.less}</span>
            <For each={state.levels} keyed={(level) => level.value}>
              {(level) => <ActivityGraphSwatch value={level().value} />}
            </For>
            <span>{state.more}</span>
          </>
        ))}
    </parts.Legend>
  );
}

export type ActivityGraphSwatchProps = ComponentProps<typeof parts.Swatch>;

/** A level's shade, by its `value` from 0. */
export function ActivityGraphSwatch(props: ActivityGraphSwatchProps) {
  return <parts.Swatch {...props} />;
}

export type ActivityGraphSummaryProps = ComponentProps<typeof parts.Summary>;

/** The total in words, like "812 runs in the last year", which describes the grid. Visually hidden. */
export function ActivityGraphSummary(props: ActivityGraphSummaryProps) {
  return (
    <parts.Summary {...omit(props, "children")}>
      {props.children ?? ((state: ActivityGraphSummaryState) => state.text)}
    </parts.Summary>
  );
}
