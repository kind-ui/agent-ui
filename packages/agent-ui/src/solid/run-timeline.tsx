import { type RunTimelineEntry, runTimelinePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
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

export type RunTimelineProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};

/**
 * A run's events in time order, on UI SDK's Timeline: a list with one Tab stop that Up and Down move through, or a
 * feed of articles with `feed`. Show earlier sits before the oldest event while `hasMore`. Any `children` replace the
 * events inside the Timeline; `RunTimelineEvents` draws them.
 */
export function RunTimeline(props: RunTimelineProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(state) => (
        <>
          <Show when={state.order === "oldest-first"}>
            <RunTimelineEnd />
          </Show>
          <KindTimeline aria-label={state.label} feed={state.feed} busy={state.busy}>
            {props.children ?? <RunTimelineEvents rows={state.rows} entries={state.entries} />}
          </KindTimeline>
          <Show when={state.order === "newest-first"}>
            <RunTimelineEnd />
          </Show>
        </>
      )}
    </parts.Root>
  );
}

export type RunTimelineEventsProps = { rows: string[]; entries: Record<string, RunTimelineEntry> };

/** A `RunTimelineEvent` for each row, keyed by id, so an event that didn't change renders nothing again. */
export function RunTimelineEvents(props: RunTimelineEventsProps) {
  return (
    <For each={props.rows}>
      {(id) => <RunTimelineEvent value={id} entry={props.entries[id] as RunTimelineEntry} />}
    </For>
  );
}

export type RunTimelineEventProps = { value: string; entry: RunTimelineEntry };

// The connector is hidden from agents, which hides UI SDK's Timeline from them (a component with a part under
// `data-agent-hidden` is off limits) while the events stay the Run Timeline's.
/** One event: a Timeline item holding its marker, title, time, actor and description. */
export function RunTimelineEvent(props: RunTimelineEventProps) {
  return (
    <RunTimelineItem value={props.value}>
      <KindTimelineItem value={props.value} status={props.entry.current ? "current" : undefined}>
        <KindTimelineMarker>
          <RunTimelineMarker />
        </KindTimelineMarker>
        <KindTimelineConnector data-agent-hidden="" />
        <KindTimelineTitle>
          <RunTimelineTitle />
        </KindTimelineTitle>
        <KindTimelineTime datetime={props.entry.at}>
          <RunTimelineTime />
        </KindTimelineTime>
        <Show when={props.entry.actor || props.entry.description}>
          <KindTimelineDescription>
            <RunTimelineActor />
            <RunTimelineDescription />
          </KindTimelineDescription>
        </Show>
      </KindTimelineItem>
    </RunTimelineItem>
  );
}

export const RunTimelineItem = parts.Item;

export type RunTimelineMarkerProps = ComponentProps<typeof parts.Marker>;

/** The event's status mark, or a dot without a status. */
export function RunTimelineMarker(props: RunTimelineMarkerProps) {
  return <parts.Marker {...props} />;
}

export type RunTimelineTitleProps = ComponentProps<typeof parts.Title>;

/** The event's `title`, then its status in words for screen readers, unless you pass children. */
export function RunTimelineTitle(props: RunTimelineTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            {state.title}
            <Show when={state.status}>
              {(status) => <span data-run-timeline-status="">{` (${status()})`}</span>}
            </Show>
          </>
        ))}
    </parts.Title>
  );
}

export type RunTimelineTimeProps = ComponentProps<typeof parts.Time>;

/** When it happened: its time today, else its date too. Server markup shows the date. */
export function RunTimelineTime(props: RunTimelineTimeProps) {
  return <parts.Time {...omit(props, "children")}>{props.children ?? ((state) => state.label)}</parts.Time>;
}

export type RunTimelineActorProps = ComponentProps<typeof parts.Actor>;

/** Who did it, unless you pass children. Rendered only with an `actor`. */
export function RunTimelineActor(props: RunTimelineActorProps) {
  return <parts.Actor {...omit(props, "children")}>{props.children ?? ((state) => state.name)}</parts.Actor>;
}

export type RunTimelineDescriptionProps = ComponentProps<typeof parts.Description>;

/** The event's `description` as Markdown, unless you pass children. Rendered only with one. */
export function RunTimelineDescription(props: RunTimelineDescriptionProps) {
  return (
    <parts.Description {...omit(props, "children")}>
      {props.children ?? ((state) => <Markdown source={state.description} />)}
    </parts.Description>
  );
}

function Loading() {
  return (
    <>
      <span data-status-mark="" data-status="running" aria-hidden="true" />
      Loading
    </>
  );
}

export type RunTimelineEndProps = ComponentProps<typeof parts.End>;

/** Show earlier while `hasMore`, else "Loading" while `busy`. */
export function RunTimelineEnd(props: RunTimelineEndProps) {
  return (
    <parts.End {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Show when={state.canLoadMore} fallback={<Loading />}>
            <RunTimelineMore />
          </Show>
        ))}
    </parts.End>
  );
}

export type RunTimelineMoreProps = ComponentProps<typeof parts.More>;

/** Calls `onLoadMore`. Reads "Loading", and does nothing, while `busy`. */
export function RunTimelineMore(props: RunTimelineMoreProps) {
  return (
    <parts.More {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Show when={state.busy} fallback="Show earlier">
            <Loading />
          </Show>
        ))}
    </parts.More>
  );
}
