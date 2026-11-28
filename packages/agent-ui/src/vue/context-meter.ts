import {
  type ContextLimitRow,
  type ContextMeterBarState,
  type ContextMeterValueState,
  type ContextRow,
  contextMeterPrimitive,
  WORDS,
} from "@kind-ui/agent-ui/core";
import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from "@ui-sdk/vue/meter";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h } from "vue";

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

/**
 * UI SDK's Meter: a ring and the percentage, after the limit it shows from 80% used, unless you pass a slot, which
 * gets the Meter's props as `state`.
 */
export const ContextMeterValue = defineComponent({
  name: "ContextMeterValue",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Value, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: ContextMeterValueState }) =>
            h(
              Meter,
              {
                value: state.value,
                max: state.max,
                locale: state.locale,
                getValueLabel: state.getValueLabel,
                "aria-label": state.label,
                "data-agent-hidden": "",
              },
              () => [
                h(MeterTrack),
                state.caption ? h("span", { "data-context-meter-caption": "" }, `${state.caption} `) : null,
                h(MeterValue),
              ],
            )),
      });
  },
});

/** Opens the details. Holds the meter unless you pass a slot. */
export const ContextMeterTrigger = defineComponent({
  name: "ContextMeterTrigger",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Trigger, attrs, { ...slots, default: slots.default ?? (() => h(ContextMeterValue)) });
  },
});

/** How full, like "86% full · Filling up", unless you pass a slot. Names the details. */
export const ContextMeterTitle = defineComponent({
  name: "ContextMeterTitle",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Title, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: { fullText: string; levelText: string } }) => [
            state.fullText,
            state.levelText ? h("span", { "data-context-meter-level": "" }, ` · ${state.levelText}`) : null,
          ]),
      });
  },
});

/** Used and total tokens, unless you pass a slot. Describes the details. */
export const ContextMeterDescription = defineComponent({
  name: "ContextMeterDescription",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Description, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { countText: string } }) => state.countText),
      });
  },
});

/** Each count and the cost supplied, unless you pass a slot. Rendered only when there's one. */
export const ContextMeterRows = defineComponent({
  name: "ContextMeterRows",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Rows, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: { rows: ContextRow[] } }) =>
            state.rows.map(({ label, value }) => h("div", { key: label }, [h("dt", label), h("dd", value)]))),
      });
  },
});

/** Compacts the conversation. Rendered while `on-compact` is set and nothing is compacting. */
export const ContextMeterCompact = defineComponent({
  name: "ContextMeterCompact",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Compact, attrs, { ...slots, default: slots.default ?? (() => WORDS.compact) });
  },
}) as unknown as typeof parts.Compact;

/** A running mark and "Compacting", in Compact's place while the conversation compacts. */
export const ContextMeterCompacting = defineComponent({
  name: "ContextMeterCompacting",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Compacting, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: { text: string } }) => [h(parts.CompactingIcon), state.text]),
      });
  },
}) as unknown as typeof parts.Compacting;

/** The breakdown as one stacked bar, with a tick at `compact-at`. One image, named by the breakdown as a sentence. */
export const ContextMeterBar = defineComponent({
  name: "ContextMeterBar",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Bar, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: ContextMeterBarState }) =>
            state.slices.map((slice) =>
              slice.color
                ? h("span", {
                    key: slice.id,
                    "data-context-meter-segment": "",
                    "data-color": slice.color,
                    style: { width: slice.width },
                  })
                : null,
            )),
      });
  },
}) as unknown as typeof parts.Bar;

/** A row per slice of the breakdown: its swatch, label, tokens and share, then Free space. */
export const ContextMeterBreakdown = defineComponent({
  name: "ContextMeterBreakdown",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Breakdown, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: ContextMeterBarState }) =>
            state.slices.map((slice) =>
              h("li", { key: slice.id, "data-color": slice.color }, [
                h("span", { "data-context-meter-swatch": "", "aria-hidden": "true" }),
                h("span", { "data-context-meter-label": "" }, slice.label),
                h("span", { "data-context-meter-tokens": "" }, slice.value),
                h("span", { "data-context-meter-share": "" }, slice.percent),
              ]),
            )),
      });
  },
}) as unknown as typeof parts.Breakdown;

/** A UI SDK Meter per limit, with its share used, reset and pace. Rendered only with `limits`. */
export const ContextMeterLimits = defineComponent({
  name: "ContextMeterLimits",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Limits, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: { limits: ContextLimitRow[] } }) =>
            state.limits.map((limit) =>
              h(
                Meter,
                {
                  key: limit.id,
                  value: limit.value,
                  max: limit.max,
                  getValueLabel: () => limit.valueText,
                  "data-agent-hidden": "",
                  "data-level": limit.low ? "high" : "normal",
                },
                () => [
                  h(MeterLabel, null, () => limit.label),
                  h(MeterValue, null, () => limit.percent),
                  h(
                    MeterTrack,
                    limit.pace === undefined
                      ? null
                      : { "data-pace": "", style: { "--kind-limit-pace": `${limit.pace * 100}%` } },
                    () => h(MeterIndicator),
                  ),
                  limit.detail ? h("span", { "data-context-meter-detail": "" }, limit.detail) : null,
                ],
              ),
            )),
      });
  },
}) as unknown as typeof parts.Limits;

const defaultDetails = () => [
  h(ContextMeterTitle),
  h(ContextMeterCompact),
  h(ContextMeterCompacting),
  h(ContextMeterDescription),
  h(ContextMeterBar),
  h(ContextMeterBreakdown),
  h(ContextMeterRows),
  h(ContextMeterLimits),
];

/**
 * The details: how full, Compact, the breakdown, the counts and the limits, unless you pass a slot. Leaves focus on
 * the trigger.
 */
export const ContextMeterContent = defineComponent({
  name: "ContextMeterContent",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        parts.Content,
        { initialFocus: "none", ...attrs },
        {
          default: slots.default ?? defaultDetails,
          // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
          render: (scope: {
            props: Record<string, unknown>;
            state: { presentation: string };
            children: Component;
          }) => {
            const element = slots.render ? slots.render(scope) : h("div", scope.props, [h(scope.children)]);
            return [scope.state.presentation === "sheet" ? h(parts.Viewport, null, () => element) : element];
          },
        },
      );
  },
});

const defaultParts = () => [h(ContextMeterTrigger), h(ContextMeterContent)];

/**
 * How much of the context window a conversation uses, and how much of the plan's limits: a ring and its percentage,
 * with details that open on hover, keyboard focus and press, or sit in the page with `layout="inline"`. A default
 * slot replaces the default parts.
 */
export const ContextMeter = defineComponent({
  name: "ContextMeter",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: slots.default ?? (attrs.layout === "inline" ? defaultDetails : defaultParts),
      });
  },
}) as unknown as typeof parts.Root;
