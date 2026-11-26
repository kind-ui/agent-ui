import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import RunTimeline from "./RunTimeline.svelte";
import RunTimelineActor from "./RunTimelineActor.svelte";
import RunTimelineDescription from "./RunTimelineDescription.svelte";
import RunTimelineEnd from "./RunTimelineEnd.svelte";
import RunTimelineEvent from "./RunTimelineEvent.svelte";
import RunTimelineEvents from "./RunTimelineEvents.svelte";
import RunTimelineMarker from "./RunTimelineMarker.svelte";
import RunTimelineMore from "./RunTimelineMore.svelte";
import RunTimelineTime from "./RunTimelineTime.svelte";
import RunTimelineTitle from "./RunTimelineTitle.svelte";

export const RunTimelineItem = parts.Item;

export {
  RunTimeline,
  RunTimelineActor,
  RunTimelineDescription,
  RunTimelineEnd,
  RunTimelineEvent,
  RunTimelineEvents,
  RunTimelineMarker,
  RunTimelineMore,
  RunTimelineTime,
  RunTimelineTitle,
};

export type RunTimelineProps = ComponentProps<typeof RunTimeline>;
export type RunTimelineEventsProps = ComponentProps<typeof RunTimelineEvents>;
export type RunTimelineEventProps = ComponentProps<typeof RunTimelineEvent>;
export type RunTimelineMarkerProps = ComponentProps<typeof RunTimelineMarker>;
export type RunTimelineTitleProps = ComponentProps<typeof RunTimelineTitle>;
export type RunTimelineTimeProps = ComponentProps<typeof RunTimelineTime>;
export type RunTimelineActorProps = ComponentProps<typeof RunTimelineActor>;
export type RunTimelineDescriptionProps = ComponentProps<typeof RunTimelineDescription>;
export type RunTimelineEndProps = ComponentProps<typeof RunTimelineEnd>;
export type RunTimelineMoreProps = ComponentProps<typeof RunTimelineMore>;
