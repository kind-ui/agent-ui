import { type ReasoningEffortControlState, reasoningEffortPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";
import {
  KindSegmentedControl,
  KindSegmentedControlIndicator,
  KindSegmentedControlItem,
} from "./internal/segmented-control.js";

const parts = createParts(reasoningEffortPrimitive, { root: "div" });

/**
 * How hard the model thinks, as a row of levels with a mark that slides to the chosen one. A default slot replaces the
 * mark and the levels, inside the Segmented Control.
 */
export const ReasoningEffort = defineComponent({
  name: "ReasoningEffort",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: ({ state }: { state: ReasoningEffortControlState }) =>
          // Hidden from agents, which use the Reasoning Effort's own `setValue`.
          h(
            KindSegmentedControl,
            {
              controller: state.controller,
              defaultValue: state.defaultValue,
              disabled: state.disabled,
              "aria-label": state["aria-label"],
              "data-agent-hidden": "",
            },
            () =>
              slots.default
                ? slots.default()
                : [
                    h(ReasoningEffortIndicator),
                    ...state.levels.map((level) =>
                      h(ReasoningEffortItem, { key: level.value, value: level.value }, () => level.label),
                    ),
                  ],
          ),
      });
  },
}) as unknown as typeof parts.Root;

/** The mark behind the chosen level. */
export const ReasoningEffortIndicator = KindSegmentedControlIndicator;

/** A level, whose `value` is what the host receives. */
export const ReasoningEffortItem = KindSegmentedControlItem;
