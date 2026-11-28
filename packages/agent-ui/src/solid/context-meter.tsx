import {
  type ContextLimitRow,
  type ContextMeterBarState,
  type ContextMeterValueState,
  type ContextRow,
  contextMeterPrimitive,
  WORDS,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from "@ui-sdk/solid/meter";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";

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
export function ContextMeter(props: ContextMeterProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (props.layout === "inline" ? <DefaultDetails /> : <DefaultParts />)}
    </parts.Root>
  );
}

export type ContextMeterTriggerProps = ComponentProps<typeof parts.Trigger>;

/** Opens the details. Holds the meter unless you pass children. */
export function ContextMeterTrigger(props: ContextMeterTriggerProps) {
  return (
    <parts.Trigger {...omit(props, "children")}>{props.children ?? <ContextMeterValue />}</parts.Trigger>
  );
}

export type ContextMeterValueProps = ComponentProps<typeof parts.Value>;

/**
 * UI SDK's Meter: a ring and the percentage, after the limit it shows from 80% used, unless you pass children, a
 * function that gets the Meter's props.
 */
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
            <Show when={meter.caption}>
              <span data-context-meter-caption="">{`${meter.caption} `}</span>
            </Show>
            <MeterValue />
          </Meter>
        ))}
    </parts.Value>
  );
}

export type ContextMeterContentProps = ComponentProps<typeof parts.Content>;

type Render = (props: Record<string, unknown>, state: { presentation?: string }) => JSX.Element;

/**
 * The details: how full, Compact, the breakdown, the counts and the limits, unless you pass children. Leaves focus
 * on the trigger.
 */
export function ContextMeterContent(props: ContextMeterContentProps) {
  const render = (content: Record<string, unknown>, state: { presentation?: string }) => {
    const element = () => {
      const own = props.render as Render | undefined;
      return own ? own(content, state) : <div {...content} />;
    };
    // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
    return (
      <Show when={state.presentation === "sheet"} fallback={element()}>
        <parts.Viewport>{element()}</parts.Viewport>
      </Show>
    );
  };
  return (
    <parts.Content
      initialFocus="none"
      {...omit(props, "children", "render")}
      render={render as ContextMeterContentProps["render"]}
    >
      {props.children ?? <DefaultDetails />}
    </parts.Content>
  );
}

export type ContextMeterTitleProps = ComponentProps<typeof parts.Title>;

/** How full, like "86% full · Filling up", unless you pass children. Names the details. */
export function ContextMeterTitle(props: ContextMeterTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ??
        ((state: { fullText: string; levelText: string | undefined }) => (
          <>
            {state.fullText}
            <Show when={state.levelText}>
              <span data-context-meter-level="">{` · ${state.levelText}`}</span>
            </Show>
          </>
        ))}
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

export type ContextMeterCompactProps = ComponentProps<typeof parts.Compact>;

/** Compacts the conversation. Rendered while `onCompact` is set and nothing is compacting. */
export function ContextMeterCompact(props: ContextMeterCompactProps) {
  return <parts.Compact {...omit(props, "children")}>{props.children ?? WORDS.compact}</parts.Compact>;
}

export type ContextMeterCompactingProps = ComponentProps<typeof parts.Compacting>;

/** A running mark and "Compacting", in Compact's place while the conversation compacts. */
export function ContextMeterCompacting(props: ContextMeterCompactingProps) {
  return (
    <parts.Compacting {...omit(props, "children")}>
      {props.children ??
        ((state: { text: string }) => (
          <>
            <parts.CompactingIcon />
            {state.text}
          </>
        ))}
    </parts.Compacting>
  );
}

export type ContextMeterBarProps = ComponentProps<typeof parts.Bar>;

/** The breakdown as one stacked bar, with a tick at `compactAt`. One image, named by the breakdown as a sentence. */
export function ContextMeterBar(props: ContextMeterBarProps) {
  return (
    <parts.Bar {...omit(props, "children")}>
      {props.children ??
        ((state: ContextMeterBarState) => (
          <For each={state.slices} keyed={(slice) => slice.id}>
            {(slice) => (
              <Show when={slice().color}>
                <span
                  data-context-meter-segment=""
                  data-color={slice().color}
                  style={{ width: slice().width }}
                />
              </Show>
            )}
          </For>
        ))}
    </parts.Bar>
  );
}

export type ContextMeterBreakdownProps = ComponentProps<typeof parts.Breakdown>;

/** A row per slice of the breakdown: its swatch, label, tokens and share, then Free space. */
export function ContextMeterBreakdown(props: ContextMeterBreakdownProps) {
  return (
    <parts.Breakdown {...omit(props, "children")}>
      {props.children ??
        ((state: ContextMeterBarState) => (
          <For each={state.slices} keyed={(slice) => slice.id}>
            {(slice) => (
              <li data-color={slice().color}>
                <span data-context-meter-swatch="" aria-hidden="true" />
                <span data-context-meter-label="">{slice().label}</span>
                <span data-context-meter-tokens="">{slice().value}</span>
                <span data-context-meter-share="">{slice().percent}</span>
              </li>
            )}
          </For>
        ))}
    </parts.Breakdown>
  );
}

export type ContextMeterLimitsProps = ComponentProps<typeof parts.Limits>;

/** A UI SDK Meter per limit, with its share used, reset and pace. Rendered only with `limits`. */
export function ContextMeterLimits(props: ContextMeterLimitsProps) {
  return (
    <parts.Limits {...omit(props, "children")}>
      {props.children ??
        ((state: { limits: ContextLimitRow[] }) => (
          <For each={state.limits} keyed={(limit) => limit.id}>
            {(limit) => (
              <Meter
                value={limit().value}
                max={limit().max}
                getValueLabel={() => limit().valueText}
                data-agent-hidden=""
                data-level={limit().low ? "high" : "normal"}
              >
                <MeterLabel>{limit().label}</MeterLabel>
                <MeterValue>{limit().percent}</MeterValue>
                <MeterTrack
                  data-pace={limit().pace === undefined ? undefined : ""}
                  style={
                    limit().pace === undefined
                      ? undefined
                      : { "--kind-limit-pace": `${(limit().pace ?? 0) * 100}%` }
                  }
                >
                  <MeterIndicator />
                </MeterTrack>
                <Show when={limit().detail}>
                  <span data-context-meter-detail="">{limit().detail}</span>
                </Show>
              </Meter>
            )}
          </For>
        ))}
    </parts.Limits>
  );
}

const DefaultDetails = () => (
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

const DefaultParts = () => (
  <>
    <ContextMeterTrigger />
    <ContextMeterContent />
  </>
);
