import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(statusPrimitive, { root: "span", icon: "span", label: "span", stalled: "span" });

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

/** "No update for 5 min", while a running status has had no update for `stalledAfter`. */
export const StatusStalled = defineComponent({
  name: "StatusStalled",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Stalled, attrs, { ...slots, default: ({ state }: { state: { text: string } }) => state.text });
  },
}) as unknown as typeof parts.Stalled;

/**
 * A run status badge: its mark, label and, while stalled, "No update for 5 min". A default slot, `StatusIcon`,
 * `StatusLabel` and `StatusStalled` among it, replaces these.
 */
export const Status = defineComponent({
  name: "Status",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: slots.default ?? (() => [h(StatusIcon), h(StatusLabel), h(StatusStalled)]),
      });
  },
}) as unknown as typeof parts.Root;
