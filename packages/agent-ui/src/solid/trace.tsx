import { type TraceRow as TraceRowData, tracePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
import {
  KindWaterfall,
  KindWaterfallAxis,
  KindWaterfallBar,
  KindWaterfallCell,
  KindWaterfallColumnHeader,
  KindWaterfallHeaderRow,
  KindWaterfallIndicator,
  KindWaterfallRow,
  KindWaterfallRowHeader,
} from "./internal/waterfall.js";

const parts = createParts(tracePrimitive, {
  root: "div",
  viewport: "div",
  axis: "div",
  name: "span",
  status: "span",
  duration: "span",
  bar: "span",
  details: "div",
  "details-close": "button",
});

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

export type TraceProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: JSX.Element };

/**
 * A trace as UI SDK Waterfall: every span a row with its kind, status, duration and bar on one time axis, nested
 * spans that expand, and the selected span's details below. Only the rows in view render. Any `children` replace
 * the viewport and details.
 */
export function Trace(props: TraceProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <TraceViewport />
          <TraceDetails />
        </>
      )}
    </parts.Root>
  );
}

export type TraceViewportProps = ComponentProps<typeof parts.Viewport>;

/**
 * The scroller around the Waterfall, with its header row and the rows in view, each placed at its offset. The axis
 * is hidden from agents, which hides UI SDK's Waterfall from them while the rows stay the Trace's. Rows are keyed by
 * span id, so a row that stays in view keeps its nodes.
 */
export function TraceViewport(props: TraceViewportProps) {
  return (
    <parts.Viewport {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <KindWaterfall
            controller={state.waterfall.controller}
            items={state.waterfall.items}
            range={state.waterfall.range}
            locale={state.waterfall.locale}
            getBarLabel={state.waterfall.getBarLabel}
            defaultValue={state.waterfall.defaultValue}
            defaultExpanded={state.waterfall.defaultExpanded}
            onValueChange={state.waterfall.onValueChange}
            onExpandedChange={state.waterfall.onExpandedChange}
            onHighlight={state.waterfall.onHighlight}
            aria-label={state.waterfall["aria-label"]}
            aria-rowcount={state.waterfall["aria-rowcount"]}
            style={{ height: `${state.height}px` }}
          >
            <KindWaterfallHeaderRow aria-rowindex={1}>
              <KindWaterfallColumnHeader>Name</KindWaterfallColumnHeader>
              <KindWaterfallColumnHeader>Duration</KindWaterfallColumnHeader>
              <KindWaterfallColumnHeader>
                <span class="sr-only">Timeline</span>
                <parts.Axis>
                  <KindWaterfallAxis data-agent-hidden="" maxTicks={5} />
                </parts.Axis>
              </KindWaterfallColumnHeader>
            </KindWaterfallHeaderRow>
            <For each={state.rows} keyed={(row) => row.key}>
              {(row) => <TraceRow row={row()} />}
            </For>
          </KindWaterfall>
        ))}
    </parts.Viewport>
  );
}

export type TraceRowProps = { row: TraceRowData };

/** A Waterfall row for a span: its name, duration and bar. */
export function TraceRow(props: TraceRowProps) {
  return (
    <KindWaterfallRow
      value={props.row.props.value}
      aria-rowindex={props.row.props["aria-rowindex"]}
      style={{ top: `${props.row.top}px` }}
    >
      <KindWaterfallRowHeader>
        <Show when={props.row.branch} fallback={<span data-trace-spacer="" />}>
          <KindWaterfallIndicator>
            <Chevron />
          </KindWaterfallIndicator>
        </Show>
        <TraceName value={props.row.key} />
      </KindWaterfallRowHeader>
      <KindWaterfallCell>
        <TraceDuration value={props.row.key} />
      </KindWaterfallCell>
      <KindWaterfallBar>
        <TraceBar value={props.row.key} />
      </KindWaterfallBar>
    </KindWaterfallRow>
  );
}

export type TraceNameProps = ComponentProps<typeof parts.Name>;

/** A span's kind glyph, name and status mark, unless you pass children. */
export function TraceName(props: TraceNameProps) {
  return (
    <parts.Name {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <span data-trace-label="">{state.name}</span> <TraceStatus value={state.id} />
          </>
        ))}
    </parts.Name>
  );
}

export type TraceStatusProps = ComponentProps<typeof parts.Status>;

/** A span's status mark, named by its status. */
export function TraceStatus(props: TraceStatusProps) {
  return <parts.Status {...props} />;
}

export type TraceDurationProps = ComponentProps<typeof parts.Duration>;

/** How long a span took, or has run so far. */
export function TraceDuration(props: TraceDurationProps) {
  return (
    <parts.Duration {...omit(props, "children")}>{props.children ?? ((state) => state.text)}</parts.Duration>
  );
}

export type TraceBarProps = ComponentProps<typeof parts.Bar>;

/** A span's bar on the time axis. */
export function TraceBar(props: TraceBarProps) {
  return <parts.Bar {...props} />;
}

/** The ruler above the bars, which holds UI SDK's axis. */
export const TraceAxis = parts.Axis;

export type TraceDetailsProps = ComponentProps<typeof parts.Details>;

/** The selected span's name, kind, status, start, duration and attributes, with Close. */
export function TraceDetails(props: TraceDetailsProps) {
  return (
    <parts.Details {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <div data-trace-details-header="">
              <p data-trace-details-title="">{state.name}</p>
              <TraceDetailsClose />
            </div>
            <dl>
              <For each={state.rows} keyed={false}>
                {(row) => (
                  <>
                    <dt>{row().term}</dt>
                    <dd>{row().detail}</dd>
                  </>
                )}
              </For>
            </dl>
          </>
        ))}
    </parts.Details>
  );
}

/** Deselects the span and returns focus to its row. Its icon is drawn in CSS; render it empty. */
export const TraceDetailsClose = parts.DetailsClose;
