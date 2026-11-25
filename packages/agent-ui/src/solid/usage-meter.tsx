import { type MeterSlice, type MeterValueState, usageMeterPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { Meter, MeterTrack, MeterValue } from "@ui-sdk/solid/meter";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

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
export function UsageMeter(props: UsageMeterProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export type UsageMeterTriggerProps = ComponentProps<typeof parts.Trigger>;

/** Opens the details. Holds the meter unless you pass children. */
export function UsageMeterTrigger(props: UsageMeterTriggerProps) {
  return <parts.Trigger {...omit(props, "children")}>{props.children ?? <UsageMeterValue />}</parts.Trigger>;
}

export type UsageMeterValueProps = ComponentProps<typeof parts.Value>;

/** UI SDK's Meter: a ring and the percentage, unless you pass children, a function that gets the Meter's props. */
export function UsageMeterValue(props: UsageMeterValueProps) {
  return (
    <parts.Value {...omit(props, "children")}>
      {props.children ??
        ((meter: MeterValueState) => (
          <Meter
            value={meter.value}
            max={meter.max}
            locale={meter.locale}
            getValueLabel={meter.getValueLabel}
            aria-label={meter.label}
            data-agent-hidden=""
          >
            <MeterTrack />
            <MeterValue />
          </Meter>
        ))}
    </parts.Value>
  );
}

export type UsageMeterContentProps = ComponentProps<typeof parts.Content>;

/** The details: the title, the amounts, the period and the breakdown, unless you pass children. Leaves focus on the trigger. */
export function UsageMeterContent(props: UsageMeterContentProps) {
  return (
    <parts.Content initialFocus="none" {...omit(props, "children")}>
      {props.children ?? <DefaultDetails />}
    </parts.Content>
  );
}

export type UsageMeterTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Names the details. */
export function UsageMeterTitle(props: UsageMeterTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Title>
  );
}

export type UsageMeterDescriptionProps = ComponentProps<typeof parts.Description>;

/** The amount used and the limit, unless you pass children. Describes the details. */
export function UsageMeterDescription(props: UsageMeterDescriptionProps) {
  return (
    <parts.Description {...omit(props, "children")}>
      {props.children ?? ((state: { countText: string }) => state.countText)}
    </parts.Description>
  );
}

export type UsageMeterBreakdownProps = ComponentProps<typeof parts.Breakdown>;

/** A stacked bar of the `breakdown`, a segment per slice, unless you pass children. Rendered only with a breakdown. */
export function UsageMeterBreakdown(props: UsageMeterBreakdownProps) {
  return (
    <parts.Breakdown {...omit(props, "children")}>
      {props.children ??
        ((state: { slices: MeterSlice[] }) => (
          <For each={state.slices} keyed={(slice) => slice.id}>
            {(slice) => <span data-slice={slice().color} style={{ width: slice().width }} />}
          </For>
        ))}
    </parts.Breakdown>
  );
}

export type UsageMeterBreakdownRowsProps = ComponentProps<typeof parts.BreakdownRows>;

/** Each slice of the `breakdown` with its amount and percent, unless you pass children. */
export function UsageMeterBreakdownRows(props: UsageMeterBreakdownRowsProps) {
  return (
    <parts.BreakdownRows {...omit(props, "children")}>
      {props.children ??
        ((state: { slices: MeterSlice[] }) => (
          <For each={state.slices} keyed={(slice) => slice.id}>
            {(slice) => (
              <div data-slice={slice().color}>
                <dt>{slice().label}</dt>
                <dd>{slice().value}</dd>
                <dd>{slice().percent}</dd>
              </div>
            )}
          </For>
        ))}
    </parts.BreakdownRows>
  );
}

export type UsageMeterPeriodProps = ComponentProps<typeof parts.Period>;

/** The `period` and the countdown to `resetAt`, unless you pass children. Rendered only with one of them. */
export function UsageMeterPeriod(props: UsageMeterPeriodProps) {
  return (
    <parts.Period {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Period>
  );
}

const DefaultDetails = () => (
  <>
    <UsageMeterTitle />
    <UsageMeterDescription />
    <UsageMeterPeriod />
    <UsageMeterBreakdown />
    <UsageMeterBreakdownRows />
  </>
);

const DefaultParts = () => (
  <>
    <UsageMeterTrigger />
    <UsageMeterContent />
  </>
);
