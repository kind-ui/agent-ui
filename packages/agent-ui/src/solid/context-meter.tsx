import { type ContextMeterValueState, type ContextRow, contextMeterPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { Meter, MeterTrack, MeterValue } from "@ui-sdk/solid/meter";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

const parts = createParts(contextMeterPrimitive, {
  root: "div",
  trigger: "button",
  value: "span",
  content: "div",
  title: "h2",
  description: "p",
  rows: "dl",
});

export type ContextMeterProps = ComponentProps<typeof parts.Root>;

/**
 * How much of the context window a conversation uses: a ring and its percentage, with details that open on hover,
 * keyboard focus and press. Any `children` replace the default parts.
 */
export function ContextMeter(props: ContextMeterProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export type ContextMeterTriggerProps = ComponentProps<typeof parts.Trigger>;

/** Opens the details. Holds the meter unless you pass children. */
export function ContextMeterTrigger(props: ContextMeterTriggerProps) {
  return (
    <parts.Trigger {...omit(props, "children")}>{props.children ?? <ContextMeterValue />}</parts.Trigger>
  );
}

export type ContextMeterValueProps = ComponentProps<typeof parts.Value>;

/** UI SDK's Meter: a ring and the percentage, unless you pass children, a function that gets the Meter's props. */
export function ContextMeterValue(props: ContextMeterValueProps) {
  return (
    <parts.Value {...omit(props, "children")}>
      {props.children ??
        ((meter: ContextMeterValueState) => (
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

export type ContextMeterContentProps = ComponentProps<typeof parts.Content>;

/** The details: the title, the value and each count, unless you pass children. Leaves focus on the trigger. */
export function ContextMeterContent(props: ContextMeterContentProps) {
  return (
    <parts.Content initialFocus="none" {...omit(props, "children")}>
      {props.children ?? <DefaultDetails />}
    </parts.Content>
  );
}

export type ContextMeterTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Names the details. */
export function ContextMeterTitle(props: ContextMeterTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Title>
  );
}

export type ContextMeterDescriptionProps = ComponentProps<typeof parts.Description>;

/** Used and total tokens, unless you pass children. Describes the details. */
export function ContextMeterDescription(props: ContextMeterDescriptionProps) {
  return (
    <parts.Description {...omit(props, "children")}>
      {props.children ?? ((state: { countText: string }) => state.countText)}
    </parts.Description>
  );
}

export type ContextMeterRowsProps = ComponentProps<typeof parts.Rows>;

/** Each count and the cost supplied, unless you pass children. Rendered only when there's one. */
export function ContextMeterRows(props: ContextMeterRowsProps) {
  return (
    <parts.Rows {...omit(props, "children")}>
      {props.children ??
        ((state: { rows: ContextRow[] }) => (
          <For each={state.rows} keyed={(row) => row.label}>
            {(row) => (
              <div>
                <dt>{row().label}</dt>
                <dd>{row().value}</dd>
              </div>
            )}
          </For>
        ))}
    </parts.Rows>
  );
}

const DefaultDetails = () => (
  <>
    <ContextMeterTitle />
    <ContextMeterDescription />
    <ContextMeterRows />
  </>
);

const DefaultParts = () => (
  <>
    <ContextMeterTrigger />
    <ContextMeterContent />
  </>
);
