import {
  type ContextMeterValueState,
  type ContextRow,
  contextMeterPrimitive,
  type MeterSlice,
} from "@kind-ui/agent-ui/core";
import { Meter, MeterTrack, MeterValue } from "@ui-sdk/vue/meter";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(contextMeterPrimitive, {
  root: "div",
  trigger: "button",
  value: "span",
  content: "div",
  title: "h2",
  description: "p",
  breakdown: "div",
  "breakdown-rows": "dl",
  rows: "dl",
});

/** UI SDK's Meter: a ring and the percentage, unless you pass a slot, which gets the Meter's props as `state`. */
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
              () => [h(MeterTrack), h(MeterValue)],
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

/** The `label`, unless you pass a slot. Names the details. */
export const ContextMeterTitle = defineComponent({
  name: "ContextMeterTitle",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Title, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { label: string } }) => state.label),
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

/** A stacked bar of the `breakdown`, a segment per slice, unless you pass a slot. Rendered only with a breakdown. */
export const ContextMeterBreakdown = defineComponent({
  name: "ContextMeterBreakdown",
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

/** Each slice of the `breakdown` with its tokens and percent, unless you pass a slot. */
export const ContextMeterBreakdownRows = defineComponent({
  name: "ContextMeterBreakdownRows",
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

const defaultDetails = () => [
  h(ContextMeterTitle),
  h(ContextMeterDescription),
  h(ContextMeterBreakdown),
  h(ContextMeterBreakdownRows),
  h(ContextMeterRows),
];

/** The details: the title, the value, the breakdown and each count, unless you pass a slot. Leaves focus on the trigger. */
export const ContextMeterContent = defineComponent({
  name: "ContextMeterContent",
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

const defaultParts = () => [h(ContextMeterTrigger), h(ContextMeterContent)];

/**
 * How much of the context window a conversation uses: a ring and its percentage, with details that open on hover,
 * keyboard focus and press. A default slot replaces the default parts.
 */
export const ContextMeter = defineComponent({
  name: "ContextMeter",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
