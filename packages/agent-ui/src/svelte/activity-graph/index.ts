import type { ComponentProps } from "svelte";
import ActivityGraph from "./ActivityGraph.svelte";
import ActivityGraphGrid from "./ActivityGraphGrid.svelte";
import ActivityGraphLegend from "./ActivityGraphLegend.svelte";
import ActivityGraphMonth from "./ActivityGraphMonth.svelte";
import ActivityGraphMonths from "./ActivityGraphMonths.svelte";
import ActivityGraphSummary from "./ActivityGraphSummary.svelte";
import ActivityGraphViewport from "./ActivityGraphViewport.svelte";
import ActivityGraphWeekday from "./ActivityGraphWeekday.svelte";
import { parts } from "./parts.js";

/** A weekday's row, by its index from the week's first day. */
export const ActivityGraphRow = parts.Row;
/** A day, by its weekday `row` and week `col`, named by its count and date. */
export const ActivityGraphCell = parts.Cell;
/** A level's shade, by its `value` from 0. */
export const ActivityGraphSwatch = parts.Swatch;

export {
  ActivityGraph,
  ActivityGraphGrid,
  ActivityGraphLegend,
  ActivityGraphMonth,
  ActivityGraphMonths,
  ActivityGraphSummary,
  ActivityGraphViewport,
  ActivityGraphWeekday,
};
export type ActivityGraphProps = ComponentProps<typeof ActivityGraph>;
export type ActivityGraphViewportProps = ComponentProps<typeof ActivityGraphViewport>;
export type ActivityGraphGridProps = ComponentProps<typeof ActivityGraphGrid>;
export type ActivityGraphMonthsProps = ComponentProps<typeof ActivityGraphMonths>;
export type ActivityGraphMonthProps = ComponentProps<typeof ActivityGraphMonth>;
export type ActivityGraphRowProps = ComponentProps<typeof ActivityGraphRow>;
export type ActivityGraphWeekdayProps = ComponentProps<typeof ActivityGraphWeekday>;
export type ActivityGraphCellProps = ComponentProps<typeof ActivityGraphCell>;
export type ActivityGraphLegendProps = ComponentProps<typeof ActivityGraphLegend>;
export type ActivityGraphSwatchProps = ComponentProps<typeof ActivityGraphSwatch>;
export type ActivityGraphSummaryProps = ComponentProps<typeof ActivityGraphSummary>;
