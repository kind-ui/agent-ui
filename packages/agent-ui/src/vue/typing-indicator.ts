import { typingIndicatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(typingIndicatorPrimitive, {
  root: "span",
  label: "span",
  dots: "span",
  dot: "span",
});

/** A polite status: three flowing dots where the reply will start. Its `label`, "Typing" by default, is for assistive technology. */
export const TypingIndicator = defineComponent({
  name: "TypingIndicator",
  inheritAttrs: false,
  setup(_, { attrs }) {
    const dots = () => h(parts.Dots, null, () => [h(parts.Dot), h(parts.Dot), h(parts.Dot)]);
    const label = () =>
      h(parts.Label, null, { default: ({ state }: { state: { label: string } }) => state.label });
    return () => h(parts.Root, attrs, () => [label(), dots()]);
  },
}) as unknown as typeof parts.Root;
