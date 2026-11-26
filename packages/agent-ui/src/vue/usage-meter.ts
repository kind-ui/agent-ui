import { type MeterSlice, type MeterValueState, usageMeterPrimitive } from "@kind-ui/agent-ui/core";
import { Meter, MeterTrack, MeterValue } from "@ui-sdk/vue/meter";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

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

/** UI SDK's Meter: a ring and the percentage, unless you pass a slot, which gets the Meter's props as `state`. */
export const UsageMeterValue = defineComponent({
  name: "UsageMeterValue",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Value, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: MeterValueState }) =>
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
              () => [h(MeterTrack), h(MeterValue)],
            )),
      });
  },
});

/** Opens the details. Holds the meter unless you pass a slot. */
export const UsageMeterTrigger = defineComponent({
  name: "UsageMeterTrigger",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Trigger, attrs, { ...slots, default: slots.default ?? (() => h(UsageMeterValue)) });
  },
});

/** The `label`, unless you pass a slot. Names the details. */
export const UsageMeterTitle = defineComponent({
  name: "UsageMeterTitle",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Title, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { label: string } }) => state.label),
      });
  },
});

/** The amount used and the limit, unless you pass a slot. Describes the details. */
export const UsageMeterDescription = defineComponent({
  name: "UsageMeterDescription",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Description, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { countText: string } }) => state.countText),
      });
  },
});

/** A stacked bar of the `breakdown`, a segment per slice, unless you pass a slot. Rendered only with a breakdown. */
export const UsageMeterBreakdown = defineComponent({
  name: "UsageMeterBreakdown",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Breakdown, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: { slices: MeterSlice[] } }) =>
            state.slices.map(({ id, width, color }) =>
              h("span", { key: id, "data-slice": color, style: { width } }),
            )),
      });
  },
});

/** Each slice of the `breakdown` with its amount and percent, unless you pass a slot. */
export const UsageMeterBreakdownRows = defineComponent({
  name: "UsageMeterBreakdownRows",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.BreakdownRows, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: { slices: MeterSlice[] } }) =>
            state.slices.map(({ id, label, value, percent, color }) =>
              h("div", { key: id, "data-slice": color }, [h("dt", label), h("dd", value), h("dd", percent)]),
            )),
      });
  },
});

/** The `period` and the countdown to `resetAt`, unless you pass a slot. Rendered only with one of them. */
export const UsageMeterPeriod = defineComponent({
  name: "UsageMeterPeriod",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Period, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { text: string } }) => state.text),
      });
  },
});

const defaultDetails = () => [
  h(UsageMeterTitle),
  h(UsageMeterDescription),
  h(UsageMeterPeriod),
  h(UsageMeterBreakdown),
  h(UsageMeterBreakdownRows),
];

/** The details: the title, the amounts, the period and the breakdown, unless you pass a slot. Leaves focus on the trigger. */
export const UsageMeterContent = defineComponent({
  name: "UsageMeterContent",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        parts.Content,
        { initialFocus: "none", ...attrs },
        { ...slots, default: slots.default ?? defaultDetails },
      );
  },
});

const defaultParts = () => [h(UsageMeterTrigger), h(UsageMeterContent)];

/**
 * Usage against a limit, like spend this month: a ring and its percentage that warns from `warnAt`, with details that
 * open on hover, keyboard focus and press. A default slot replaces the default parts.
 */
export const UsageMeter = defineComponent({
  name: "UsageMeter",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
