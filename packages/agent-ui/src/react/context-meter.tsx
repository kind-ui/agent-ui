"use client";

import { contextMeterPrimitive, WORDS } from "@kind-ui/agent-ui/core";
import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from "@ui-sdk/react/meter";
import { createParts, renderElement } from "@ui-sdk/react/primitive";
import type { ComponentProps, CSSProperties } from "react";

const parts = createParts(contextMeterPrimitive, {
  root: "div",
  trigger: "button",
  value: "span",
  content: "div",
  title: "h2",
  description: "p",
  rows: "dl",
  viewport: "div",
  compact: "button",
  compacting: "span",
  "compacting-icon": "span",
  bar: "div",
  breakdown: "ul",
  limits: "div",
});

export type ContextMeterProps = ComponentProps<typeof parts.Root>;

/**
 * How much of the context window a conversation uses, and how much of the plan's limits: a ring and its percentage,
 * with details that open on hover, keyboard focus and press, or sit in the page with `layout="inline"`. Any
 * `children` replace the default parts.
 */
export function ContextMeter({ children, ...props }: ContextMeterProps) {
  return (
    <parts.Root {...props}>
      {children ?? (props.layout === "inline" ? DEFAULT_DETAILS : DEFAULT_PARTS)}
    </parts.Root>
  );
}

export type ContextMeterTriggerProps = ComponentProps<typeof parts.Trigger>;

/** Opens the details. Holds the meter unless you pass children. */
export function ContextMeterTrigger({ children = DEFAULT_VALUE, ...props }: ContextMeterTriggerProps) {
  return <parts.Trigger {...props}>{children}</parts.Trigger>;
}

export type ContextMeterValueProps = ComponentProps<typeof parts.Value>;

/**
 * UI SDK's Meter: a ring and the percentage, after the limit it shows from 80% used, unless you pass children, a
 * function that gets the Meter's props.
 */
export function ContextMeterValue({
  children = ({ label, caption, ...meter }) => (
    <Meter {...meter} aria-label={label} data-agent-hidden="">
      <MeterTrack />
      {caption ? <span data-context-meter-caption="">{caption}</span> : null}
      <MeterValue />
    </Meter>
  ),
  ...props
}: ContextMeterValueProps) {
  return <parts.Value {...props}>{children}</parts.Value>;
}

export type ContextMeterContentProps = ComponentProps<typeof parts.Content>;

/**
 * The details: how full, Compact, the breakdown, the counts and the limits, unless you pass children. Leaves focus
 * on the trigger.
 */
export function ContextMeterContent({
  children = DEFAULT_DETAILS,
  render,
  ...props
}: ContextMeterContentProps) {
  return (
    <parts.Content
      initialFocus="none"
      {...props}
      // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
      render={(content, state) => {
        const element = renderElement("div", content, render, state);
        return state.presentation === "sheet" ? <parts.Viewport>{element}</parts.Viewport> : element;
      }}
    >
      {children}
    </parts.Content>
  );
}

export type ContextMeterTitleProps = ComponentProps<typeof parts.Title>;

/** How full, like "86% full · Filling up", unless you pass children. Names the details. */
export function ContextMeterTitle({
  children = ({ fullText, levelText }) => (
    <>
      {fullText}
      {levelText ? <span data-context-meter-level="">{` · ${levelText}`}</span> : null}
    </>
  ),
  ...props
}: ContextMeterTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type ContextMeterDescriptionProps = ComponentProps<typeof parts.Description>;

/** Used and total tokens, unless you pass children. Describes the details. */
export function ContextMeterDescription({
  children = ({ countText }) => countText,
  ...props
}: ContextMeterDescriptionProps) {
  return <parts.Description {...props}>{children}</parts.Description>;
}

export type ContextMeterRowsProps = ComponentProps<typeof parts.Rows>;

/** Each count and the cost supplied, unless you pass children. Rendered only when there's one. */
export function ContextMeterRows({
  children = ({ rows }) =>
    rows.map(({ label, value }) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    )),
  ...props
}: ContextMeterRowsProps) {
  return <parts.Rows {...props}>{children}</parts.Rows>;
}

export type ContextMeterCompactProps = ComponentProps<typeof parts.Compact>;

/** Compacts the conversation. Rendered while `onCompact` is set and nothing is compacting. */
export function ContextMeterCompact({ children = WORDS.compact, ...props }: ContextMeterCompactProps) {
  return <parts.Compact {...props}>{children}</parts.Compact>;
}

export type ContextMeterCompactingProps = ComponentProps<typeof parts.Compacting>;

/** A running mark and "Compacting", in Compact's place while the conversation compacts. */
export function ContextMeterCompacting({
  children = ({ text }) => (
    <>
      <parts.CompactingIcon />
      {text}
    </>
  ),
  ...props
}: ContextMeterCompactingProps) {
  return <parts.Compacting {...props}>{children}</parts.Compacting>;
}

export type ContextMeterBarProps = ComponentProps<typeof parts.Bar>;

/** The breakdown as one stacked bar, with a tick at `compactAt`. One image, named by the breakdown as a sentence. */
export function ContextMeterBar({
  children = ({ slices }) =>
    slices.map((slice) =>
      slice.color ? (
        <span
          key={slice.id}
          data-context-meter-segment=""
          data-color={slice.color}
          style={{ width: slice.width }}
        />
      ) : null,
    ),
  ...props
}: ContextMeterBarProps) {
  return <parts.Bar {...props}>{children}</parts.Bar>;
}

export type ContextMeterBreakdownProps = ComponentProps<typeof parts.Breakdown>;

/** A row per slice of the breakdown: its swatch, label, tokens and share, then Free space. */
export function ContextMeterBreakdown({
  children = ({ slices }) =>
    slices.map((slice) => (
      <li key={slice.id} data-color={slice.color}>
        <span data-context-meter-swatch="" aria-hidden="true" />
        <span data-context-meter-label="">{slice.label}</span>
        <span data-context-meter-tokens="">{slice.value}</span>
        <span data-context-meter-share="">{slice.percent}</span>
      </li>
    )),
  ...props
}: ContextMeterBreakdownProps) {
  return <parts.Breakdown {...props}>{children}</parts.Breakdown>;
}

export type ContextMeterLimitsProps = ComponentProps<typeof parts.Limits>;

/** A UI SDK Meter per limit, with its share used, reset and pace. Rendered only with `limits`. */
export function ContextMeterLimits({
  children = ({ limits }) =>
    limits.map((limit) => (
      <Meter
        key={limit.id}
        value={limit.value}
        max={limit.max}
        getValueLabel={() => limit.valueText}
        data-agent-hidden=""
        data-level={limit.low ? "high" : "normal"}
      >
        <MeterLabel>{limit.label}</MeterLabel>
        <MeterValue>{() => limit.percent}</MeterValue>
        <MeterTrack
          data-pace={limit.pace === undefined ? undefined : ""}
          style={
            limit.pace === undefined
              ? undefined
              : ({ "--kind-limit-pace": `${limit.pace * 100}%` } as CSSProperties)
          }
        >
          <MeterIndicator />
        </MeterTrack>
        {limit.detail ? <span data-context-meter-detail="">{limit.detail}</span> : null}
      </Meter>
    )),
  ...props
}: ContextMeterLimitsProps) {
  return <parts.Limits {...props}>{children}</parts.Limits>;
}

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_VALUE = <ContextMeterValue />;

const DEFAULT_DETAILS = (
  <>
    <ContextMeterTitle />
    <ContextMeterCompact />
    <ContextMeterCompacting />
    <ContextMeterDescription />
    <ContextMeterBar />
    <ContextMeterBreakdown />
    <ContextMeterRows />
    <ContextMeterLimits />
  </>
);

const DEFAULT_PARTS = (
  <>
    <ContextMeterTrigger />
    <ContextMeterContent />
  </>
);
