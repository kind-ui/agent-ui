"use client";

import { type RunTimelineEntry, runTimelinePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import { type ComponentProps, memo, type ReactNode } from "react";
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

const parts = createParts(runTimelinePrimitive, {
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

export type RunTimelineProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: ReactNode };

/**
 * A run's events in time order, on UI SDK's Timeline: a list with one Tab stop that Up and Down move through, or a
 * feed of articles with `feed`. Show earlier sits before the oldest event while `hasMore`. Any `children` replace the
 * events inside the Timeline; `RunTimelineEvents` draws them.
 */
export function RunTimeline({ children, ...props }: RunTimelineProps) {
  return (
    <parts.Root {...props}>
      {({ label, feed, busy, order, rows, entries }) => (
        <>
          {order === "oldest-first" ? <RunTimelineEnd /> : null}
          <KindTimeline aria-label={label} feed={feed} busy={busy}>
            {children ?? <RunTimelineEvents rows={rows} entries={entries} />}
          </KindTimeline>
          {order === "newest-first" ? <RunTimelineEnd /> : null}
        </>
      )}
    </parts.Root>
  );
}

export type RunTimelineEventsProps = { rows: string[]; entries: Record<string, RunTimelineEntry> };

/** A `RunTimelineEvent` for each row. */
export function RunTimelineEvents({ rows, entries }: RunTimelineEventsProps) {
  return rows.map((id) => <RunTimelineEvent key={id} value={id} entry={entries[id] as RunTimelineEntry} />);
}

export type RunTimelineEventProps = { value: string; entry: RunTimelineEntry };

// The connector is hidden from agents, which hides UI SDK's Timeline from them (a component with a part under
// `data-agent-hidden` is off limits) while the events stay the Run Timeline's.
/** One event: a Timeline item holding its marker, title, time, actor and description. */
export const RunTimelineEvent = memo(function RunTimelineEvent({ value, entry }: RunTimelineEventProps) {
  return (
    <RunTimelineItem value={value}>
      <KindTimelineItem value={value} status={entry.current ? "current" : undefined}>
        <KindTimelineMarker>
          <RunTimelineMarker />
        </KindTimelineMarker>
        <KindTimelineConnector data-agent-hidden="" />
        <KindTimelineTitle>
          <RunTimelineTitle />
        </KindTimelineTitle>
        <KindTimelineTime dateTime={entry.at}>
          <RunTimelineTime />
        </KindTimelineTime>
        {entry.actor || entry.description ? (
          <KindTimelineDescription>
            <RunTimelineActor />
            <RunTimelineDescription />
          </KindTimelineDescription>
        ) : null}
      </KindTimelineItem>
    </RunTimelineItem>
  );
});

export const RunTimelineItem = parts.Item;

export type RunTimelineMarkerProps = ComponentProps<typeof parts.Marker>;

/** The event's status mark, or a dot without a status. */
export function RunTimelineMarker(props: RunTimelineMarkerProps) {
  return <parts.Marker {...props} />;
}

export type RunTimelineTitleProps = ComponentProps<typeof parts.Title>;

/** The event's `title`, then its status in words for screen readers, unless you pass children. */
export function RunTimelineTitle({
  children = ({ title, status }) => (
    <>
      {title}
      {status ? <span data-run-timeline-status="">{` (${status})`}</span> : null}
    </>
  ),
  ...props
}: RunTimelineTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type RunTimelineTimeProps = ComponentProps<typeof parts.Time>;

/** When it happened: its time today, else its date too. Server markup shows the date. */
export function RunTimelineTime({ children = ({ label }) => label, ...props }: RunTimelineTimeProps) {
  return <parts.Time {...props}>{children}</parts.Time>;
}

export type RunTimelineActorProps = ComponentProps<typeof parts.Actor>;

/** Who did it, unless you pass children. Rendered only with an `actor`. */
export function RunTimelineActor({ children = ({ name }) => name, ...props }: RunTimelineActorProps) {
  return <parts.Actor {...props}>{children}</parts.Actor>;
}

export type RunTimelineDescriptionProps = ComponentProps<typeof parts.Description>;

/** The event's `description` as Markdown, unless you pass children. Rendered only with one. */
export function RunTimelineDescription({
  children = ({ description }) => <Markdown source={description} />,
  ...props
}: RunTimelineDescriptionProps) {
  return <parts.Description {...props}>{children}</parts.Description>;
}

export type RunTimelineEndProps = ComponentProps<typeof parts.End>;

/** Show earlier while `hasMore`, else "Loading" while `busy`. */
export function RunTimelineEnd({
  children = ({ canLoadMore }) =>
    canLoadMore ? (
      <RunTimelineMore />
    ) : (
      <>
        <span data-status-mark="" data-status="running" aria-hidden="true" />
        Loading
      </>
    ),
  ...props
}: RunTimelineEndProps) {
  return <parts.End {...props}>{children}</parts.End>;
}

export type RunTimelineMoreProps = ComponentProps<typeof parts.More>;

/** Calls `onLoadMore`. Reads "Loading", and does nothing, while `busy`. */
export function RunTimelineMore({
  children = ({ busy }) =>
    busy ? (
      <>
        <span data-status-mark="" data-status="running" aria-hidden="true" />
        Loading
      </>
    ) : (
      "Show earlier"
    ),
  ...props
}: RunTimelineMoreProps) {
  return <parts.More {...props}>{children}</parts.More>;
}
