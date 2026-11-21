import { loaderPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(loaderPrimitive, { root: "span", label: "span", dots: "span", dot: "span" });

/** A polite status: three flowing dots beside its `label`, "Loading…" by default. */
export const Loader = defineComponent({
  name: "Loader",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    const dots = () => h(parts.Dots, null, () => [h(parts.Dot), h(parts.Dot), h(parts.Dot)]);
    const label = () =>
      h(parts.Label, null, { default: ({ state }: { state: { label: string } }) => state.label });
    return () => h(parts.Root, attrs, { ...slots, default: () => [dots(), label()] });
  },
}) as unknown as typeof parts.Root;
