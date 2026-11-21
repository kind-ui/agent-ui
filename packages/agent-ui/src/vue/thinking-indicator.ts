import { thinkingIndicatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(thinkingIndicatorPrimitive, {
  root: "span",
  label: "span",
  dots: "span",
  dot: "span",
});

/** A polite status: three flowing dots, then its `label`, "Thinking…" by default. */
export const ThinkingIndicator = defineComponent({
  name: "ThinkingIndicator",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const dots = () => h(parts.Dots, null, () => [h(parts.Dot), h(parts.Dot), h(parts.Dot)]);
    const label = () =>
      h(parts.Label, null, { default: ({ state }: { state: { label: string } }) => state.label });
    return () => h(parts.Root, attrs, { ...slots, default: () => [dots(), label()] });
  },
}) as unknown as typeof parts.Root;
