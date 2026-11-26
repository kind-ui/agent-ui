"use client";

import { usageMeterPrimitive } from "@kind-ui/agent-ui/core";
import { Meter, MeterTrack, MeterValue } from "@ui-sdk/react/meter";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";

const parts = createParts(usageMeterPrimitive, {
  root: "div",
  trigger: "button",
  value: "span",
  content: "div",
  title: "h2",
  description: "p",
  breakdown: "div",
  "breakdown-rows": "dl",
  period: "p",
});

export type UsageMeterProps = ComponentProps<typeof parts.Root>;

/**
 * Usage against a limit, like spend this month: a ring and its percentage that warns from `warnAt`, with details that
 * open on hover, keyboard focus and press. Any `children` replace the default parts.
 */
export function UsageMeter({ children = DEFAULT_PARTS, ...props }: UsageMeterProps) {
  return <parts.Root {...props}>{children}</parts.Root>;
}

export type UsageMeterTriggerProps = ComponentProps<typeof parts.Trigger>;

/** Opens the details. Holds the meter unless you pass children. */
export function UsageMeterTrigger({ children = DEFAULT_VALUE, ...props }: UsageMeterTriggerProps) {
  return <parts.Trigger {...props}>{children}</parts.Trigger>;
}

export type UsageMeterValueProps = ComponentProps<typeof parts.Value>;

/** UI SDK's Meter: a ring and the percentage, unless you pass children, a function that gets the Meter's props. */
export function UsageMeterValue({
  children = ({ label, ...meter }) => (
    <Meter {...meter} aria-label={label} data-agent-hidden="">
      <MeterTrack />
      <MeterValue />
    </Meter>
  ),
  ...props
}: UsageMeterValueProps) {
  return <parts.Value {...props}>{children}</parts.Value>;
}

export type UsageMeterContentProps = ComponentProps<typeof parts.Content>;

/** The details: the title, the amounts, the period and the breakdown, unless you pass children. Leaves focus on the trigger. */
export function UsageMeterContent({ children = DEFAULT_DETAILS, ...props }: UsageMeterContentProps) {
  return (
    <parts.Content initialFocus="none" {...props}>
      {children}
    </parts.Content>
  );
}

export type UsageMeterTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Names the details. */
export function UsageMeterTitle({ children = ({ label }) => label, ...props }: UsageMeterTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type UsageMeterDescriptionProps = ComponentProps<typeof parts.Description>;

/** The amount used and the limit, unless you pass children. Describes the details. */
export function UsageMeterDescription({
  children = ({ countText }) => countText,
  ...props
}: UsageMeterDescriptionProps) {
  return <parts.Description {...props}>{children}</parts.Description>;
}

export type UsageMeterBreakdownProps = ComponentProps<typeof parts.Breakdown>;

/** A stacked bar of the `breakdown`, a segment per slice, unless you pass children. Rendered only with a breakdown. */
export function UsageMeterBreakdown({
  children = ({ slices }) =>
    slices.map(({ id, width, color }) => <span key={id} data-slice={color} style={{ width }} />),
  ...props
}: UsageMeterBreakdownProps) {
  return <parts.Breakdown {...props}>{children}</parts.Breakdown>;
}

export type UsageMeterBreakdownRowsProps = ComponentProps<typeof parts.BreakdownRows>;

/** Each slice of the `breakdown` with its amount and percent, unless you pass children. */
export function UsageMeterBreakdownRows({
  children = ({ slices }) =>
    slices.map(({ id, label, value, percent, color }) => (
      <div key={id} data-slice={color}>
        <dt>{label}</dt>
        <dd>{value}</dd>
        <dd>{percent}</dd>
      </div>
    )),
  ...props
}: UsageMeterBreakdownRowsProps) {
  return <parts.BreakdownRows {...props}>{children}</parts.BreakdownRows>;
}

export type UsageMeterPeriodProps = ComponentProps<typeof parts.Period>;

/** The `period` and the countdown to `resetAt`, unless you pass children. Rendered only with one of them. */
export function UsageMeterPeriod({ children = ({ text }) => text, ...props }: UsageMeterPeriodProps) {
  return <parts.Period {...props}>{children}</parts.Period>;
}

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_VALUE = <UsageMeterValue />;

const DEFAULT_DETAILS = (
  <>
    <UsageMeterTitle />
    <UsageMeterDescription />
    <UsageMeterPeriod />
    <UsageMeterBreakdown />
    <UsageMeterBreakdownRows />
  </>
);

const DEFAULT_PARTS = (
  <>
    <UsageMeterTrigger />
    <UsageMeterContent />
  </>
);
