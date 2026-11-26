"use client";

import { activityGraphPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";

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
export function ActivityGraph({ children = DEFAULT_PARTS, ...props }: ActivityGraphProps) {
  return <parts.Root {...props}>{children}</parts.Root>;
}

export type ActivityGraphViewportProps = ComponentProps<typeof parts.Viewport>;

/** Scrolls the grid sideways when it doesn't fit, starting at the latest week. Holds the grid unless you pass children. */
export function ActivityGraphViewport({ children = DEFAULT_GRID, ...props }: ActivityGraphViewportProps) {
  return <parts.Viewport {...props}>{children}</parts.Viewport>;
}

export type ActivityGraphGridProps = ComponentProps<typeof parts.Grid>;

/** The days: the month labels over the weeks, then a row per weekday, its name and its days. */
export function ActivityGraphGrid({
  children = ({ rows }) => (
    <>
      <ActivityGraphMonths />
      {rows.map((row) => (
        <ActivityGraphRow key={row.value} value={row.value}>
          <ActivityGraphWeekday value={row.value} />
          {row.cells.map((cell) => (
            <ActivityGraphCell key={cell.value} value={cell.value} row={cell.row} col={cell.col} />
          ))}
        </ActivityGraphRow>
      ))}
    </>
  ),
  ...props
}: ActivityGraphGridProps) {
  return <parts.Grid {...props}>{children}</parts.Grid>;
}

export type ActivityGraphMonthsProps = ComponentProps<typeof parts.Months>;

/** The months over their first week, hidden from assistive technology, which reads each day's date. */
export function ActivityGraphMonths({
  children = ({ months }) =>
    months.map((month) => <ActivityGraphMonth key={month.value} value={month.value} />),
  ...props
}: ActivityGraphMonthsProps) {
  return <parts.Months {...props}>{children}</parts.Months>;
}

export type ActivityGraphMonthProps = ComponentProps<typeof parts.Month>;

/** A month's short name over the week column its `value` names. */
export function ActivityGraphMonth({ children = ({ label }) => label, ...props }: ActivityGraphMonthProps) {
  return <parts.Month {...props}>{children}</parts.Month>;
}

export type ActivityGraphRowProps = ComponentProps<typeof parts.Row>;

/** A weekday's row, by its index from the week's first day. */
export function ActivityGraphRow(props: ActivityGraphRowProps) {
  return <parts.Row {...props} />;
}

export type ActivityGraphWeekdayProps = ComponentProps<typeof parts.Weekday>;

/** The row's header: the weekday's short name. */
export function ActivityGraphWeekday({
  children = ({ label }) => label,
  ...props
}: ActivityGraphWeekdayProps) {
  return <parts.Weekday {...props}>{children}</parts.Weekday>;
}

export type ActivityGraphCellProps = ComponentProps<typeof parts.Cell>;

/** A day, by its weekday `row` and week `col`, named by its count and date. */
export function ActivityGraphCell(props: ActivityGraphCellProps) {
  return <parts.Cell {...props} />;
}

export type ActivityGraphLegendProps = ComponentProps<typeof parts.Legend>;

/** "Less", a swatch per level, "More". Hidden from assistive technology, which reads each day's count. */
export function ActivityGraphLegend({
  children = ({ less, more, levels }) => (
    <>
      <span>{less}</span>
      {levels.map((level) => (
        <ActivityGraphSwatch key={level.value} value={level.value} />
      ))}
      <span>{more}</span>
    </>
  ),
  ...props
}: ActivityGraphLegendProps) {
  return <parts.Legend {...props}>{children}</parts.Legend>;
}

export type ActivityGraphSwatchProps = ComponentProps<typeof parts.Swatch>;

/** A level's shade, by its `value` from 0. */
export function ActivityGraphSwatch(props: ActivityGraphSwatchProps) {
  return <parts.Swatch {...props} />;
}

export type ActivityGraphSummaryProps = ComponentProps<typeof parts.Summary>;

/** The total in words, like "812 runs in the last year", which describes the grid. Visually hidden. */
export function ActivityGraphSummary({ children = ({ text }) => text, ...props }: ActivityGraphSummaryProps) {
  return <parts.Summary {...props}>{children}</parts.Summary>;
}

const DEFAULT_GRID = <ActivityGraphGrid />;

const DEFAULT_PARTS = (
  <>
    <ActivityGraphViewport />
    <ActivityGraphLegend />
    <ActivityGraphSummary />
  </>
);
