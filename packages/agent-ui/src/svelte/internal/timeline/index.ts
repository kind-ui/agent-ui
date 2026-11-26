import {
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/svelte/timeline";
import { withKindClass } from "../kind-class.js";

export const KindTimeline = withKindClass(Timeline, "flex flex-col");
export const KindTimelineItem = withKindClass(
  TimelineItem,
  "relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 rounded-[var(--kind-radius-md)] px-1 pb-4 outline-hidden focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset-inset)]",
);
export const KindTimelineMarker = withKindClass(
  TimelineMarker,
  "col-start-1 row-start-1 flex h-5 items-center justify-center",
);
export const KindTimelineConnector = withKindClass(
  TimelineConnector,
  "absolute start-[calc(0.25rem+0.5rem-0.5px)] top-6 bottom-1 w-px bg-[var(--kind-color-hairline)] [[data-last]>&]:hidden",
);
export const KindTimelineTitle = withKindClass(
  TimelineTitle,
  "col-start-2 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)]",
);
export const KindTimelineTime = withKindClass(
  TimelineTime,
  "col-start-2 text-[length:var(--kind-text-sm)]/5 text-[var(--kind-color-muted)]",
);
export const KindTimelineDescription = withKindClass(
  TimelineDescription,
  "col-start-2 mt-1 text-[length:var(--kind-text-md)]/5 text-[var(--kind-color-fg)]",
);
