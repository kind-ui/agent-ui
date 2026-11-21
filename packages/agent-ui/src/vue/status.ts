import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(statusPrimitive, { root: "span", icon: "span", label: "span" });

export const StatusIcon = parts.Icon;

/** The status's text: its `label`, unless you fill the default slot. */
export const StatusLabel = defineComponent({
  name: "StatusLabel",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Label, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { label: string } }) => state.label),
      });
  },
}) as unknown as typeof parts.Label;

/** A run status badge: its mark and label. A default slot, `StatusIcon` and `StatusLabel` among it, replaces both. */
export const Status = defineComponent({
  name: "Status",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, { ...slots, default: slots.default ?? (() => [h(StatusIcon), h(StatusLabel)]) });
  },
}) as unknown as typeof parts.Root;
