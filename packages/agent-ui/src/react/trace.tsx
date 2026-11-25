"use client";

import { type TraceRow as TraceRowData, tracePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import { type ComponentProps, Fragment, memo, type ReactNode } from "react";
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
const CHEVRON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type TraceProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: ReactNode };

/**
 * A trace as UI SDK Waterfall: every span a row with its kind, status, duration and bar on one time axis, nested
 * spans that expand, and the selected span's details below. Only the rows in view render. Any `children` replace
 * the viewport and details.
 */
export function Trace({ children, ...props }: TraceProps) {
  return (
    <parts.Root {...props}>
      {children ?? (
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
 * is hidden from agents, which hides UI SDK's Waterfall from them while the rows stay the Trace's.
 */
export function TraceViewport(props: TraceViewportProps) {
  return (
    <parts.Viewport {...props}>
      {({ waterfall, rows, height }) => (
        <KindWaterfall {...waterfall} style={{ height }}>
          <KindWaterfallHeaderRow aria-rowindex={1}>
            <KindWaterfallColumnHeader>Name</KindWaterfallColumnHeader>
            <KindWaterfallColumnHeader>Duration</KindWaterfallColumnHeader>
            <KindWaterfallColumnHeader aria-label="Timeline">
              <parts.Axis>
                <KindWaterfallAxis data-agent-hidden="" maxTicks={5} />
              </parts.Axis>
            </KindWaterfallColumnHeader>
          </KindWaterfallHeaderRow>
          {rows.map((row) => (
            <TraceRow key={row.key} row={row} />
          ))}
        </KindWaterfall>
      )}
    </parts.Viewport>
  );
}

export type TraceRowProps = { row: TraceRowData };

/** A Waterfall row for a span: its name, duration and bar. */
export const TraceRow = memo(function TraceRow({ row }: TraceRowProps) {
  return (
    <KindWaterfallRow {...row.props} style={{ top: row.top }}>
      <KindWaterfallRowHeader>
        {row.branch ? <KindWaterfallIndicator>{CHEVRON}</KindWaterfallIndicator> : <span data-trace-spacer="" />}
        <TraceName value={row.key} />
      </KindWaterfallRowHeader>
      <KindWaterfallCell>
        <TraceDuration value={row.key} />
      </KindWaterfallCell>
      <KindWaterfallBar>
        <TraceBar value={row.key} />
      </KindWaterfallBar>
    </KindWaterfallRow>
  );
});

export type TraceNameProps = ComponentProps<typeof parts.Name>;

/** A span's kind glyph, name and status mark, unless you pass children. */
export function TraceName({
  children = ({ id, name }) => (
    <>
      <span data-trace-label="">{name}</span> <TraceStatus value={id} />
    </>
  ),
  ...props
}: TraceNameProps) {
  return <parts.Name {...props}>{children}</parts.Name>;
}

export type TraceStatusProps = ComponentProps<typeof parts.Status>;

/** A span's status mark, named by its status. */
export function TraceStatus(props: TraceStatusProps) {
  return <parts.Status {...props} />;
}

export type TraceDurationProps = ComponentProps<typeof parts.Duration>;

/** How long a span took, or has run so far. */
export function TraceDuration({ children = ({ text }) => text, ...props }: TraceDurationProps) {
  return <parts.Duration {...props}>{children}</parts.Duration>;
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
export function TraceDetails({
  children = ({ name, rows }) => (
    <>
      <div data-trace-details-header="">
        <p data-trace-details-title="">{name}</p>
        <TraceDetailsClose />
      </div>
      <dl>
        {rows.map(({ term, detail }) => (
          <Fragment key={term}>
            <dt>{term}</dt>
            <dd>{detail}</dd>
          </Fragment>
        ))}
      </dl>
    </>
  ),
  ...props
}: TraceDetailsProps) {
  return <parts.Details {...props}>{children}</parts.Details>;
}

/** Deselects the span and returns focus to its row. Its icon is drawn in CSS; render it empty. */
export const TraceDetailsClose = parts.DetailsClose;
