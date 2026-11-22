import { daySeparatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(daySeparatorPrimitive, { root: "div", label: "time" });

/** The day as a `<time datetime>`: its words, unless you fill the default slot. */
export const DaySeparatorLabel = defineComponent({
  name: "DaySeparatorLabel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Label, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { label: string } }) => state.label),
      });
  },
}) as unknown as typeof parts.Label;

/** A heading between days: the date on the server, and "Today", "Yesterday" or a weekday once in the browser. */
export const DaySeparator = defineComponent({
  name: "DaySeparator",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? (() => h(DaySeparatorLabel)) });
  },
}) as unknown as typeof parts.Root;
