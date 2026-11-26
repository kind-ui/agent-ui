import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Trace from "./Trace.svelte";
import TraceBar from "./TraceBar.svelte";
import TraceDetails from "./TraceDetails.svelte";
import TraceDuration from "./TraceDuration.svelte";
import TraceName from "./TraceName.svelte";
import TraceRow from "./TraceRow.svelte";
import TraceStatus from "./TraceStatus.svelte";
import TraceViewport from "./TraceViewport.svelte";

/** The ruler above the bars, which holds UI SDK's axis. */
export const TraceAxis = parts.Axis;
/** Deselects the span and returns focus to its row. Its icon is drawn in CSS; render it empty. */
export const TraceDetailsClose = parts.DetailsClose;

export { Trace, TraceBar, TraceDetails, TraceDuration, TraceName, TraceRow, TraceStatus, TraceViewport };

export type TraceProps = ComponentProps<typeof Trace>;
export type TraceViewportProps = ComponentProps<typeof TraceViewport>;
export type TraceRowProps = ComponentProps<typeof TraceRow>;
export type TraceNameProps = ComponentProps<typeof TraceName>;
export type TraceStatusProps = ComponentProps<typeof TraceStatus>;
export type TraceDurationProps = ComponentProps<typeof TraceDuration>;
export type TraceBarProps = ComponentProps<typeof TraceBar>;
export type TraceDetailsProps = ComponentProps<typeof TraceDetails>;
