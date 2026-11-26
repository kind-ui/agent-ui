import {
  Waterfall,
  WaterfallAxis,
  WaterfallBar,
  WaterfallCell,
  WaterfallColumnHeader,
  WaterfallHeaderRow,
  WaterfallIndicator,
  WaterfallRow,
  WaterfallRowHeader,
} from "@ui-sdk/solid/waterfall";
import { withKindClass } from "./kind-class.js";

// Rows and the header row share one grid, whose columns and row height a component sets through
// `--kind-waterfall-columns` and `--kind-waterfall-row-height`.
const grid =
  "grid [grid-template-columns:var(--kind-waterfall-columns,minmax(10rem,2fr)_minmax(4.5rem,auto)_3fr)] items-center h-[var(--kind-waterfall-row-height,1.75rem)]";
const cell =
  "flex min-w-0 h-full items-center px-2 outline-hidden focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset-inset)]";

export const KindWaterfall = withKindClass(
  Waterfall,
  "relative block text-[length:var(--kind-text-sm)]/5 text-[var(--kind-color-fg)]",
);
export const KindWaterfallHeaderRow = withKindClass(
  WaterfallHeaderRow,
  `${grid} border-b border-[var(--kind-color-hairline)] bg-[var(--kind-color-surface)] text-[length:var(--kind-text-xs)] text-[var(--kind-color-muted)]`,
);
export const KindWaterfallColumnHeader = withKindClass(
  WaterfallColumnHeader,
  "relative flex min-w-0 h-full items-center px-2",
);
export const KindWaterfallAxis = withKindClass(WaterfallAxis, "relative block h-full w-full");
export const KindWaterfallRow = withKindClass(
  WaterfallRow,
  `${grid} [&[hidden]]:hidden cursor-default rounded-[var(--kind-radius-sm)] outline-hidden select-none hover:bg-[var(--kind-color-hover)] data-selected:bg-[var(--kind-color-selected)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset-inset)]`,
);
export const KindWaterfallRowHeader = withKindClass(
  WaterfallRowHeader,
  `${cell} gap-1.5 ps-[calc((var(--waterfall-level)-1)*1rem+0.25rem)]`,
);
export const KindWaterfallIndicator = withKindClass(
  WaterfallIndicator,
  "inline-flex size-4 shrink-0 items-center justify-center text-[var(--kind-color-muted)] [&_svg]:size-3.5 rtl:[&_svg]:-scale-x-100 data-expanded:[&_svg]:rotate-90 rtl:data-expanded:[&_svg]:-rotate-90",
);
export const KindWaterfallCell = withKindClass(
  WaterfallCell,
  `${cell} justify-end tabular-nums text-[var(--kind-color-muted)]`,
);
export const KindWaterfallBar = withKindClass(WaterfallBar, `${cell} relative`);
