import { codeSpans, stepGroupPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";

const parts = createParts(stepGroupPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  children: "div",
});

// A part whose default slot falls back to `fallback`, as React's default `children` do.
const withDefault = <State, Part extends Component = Component>(
  part: Part,
  name: string,
  fallback: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part as Component, attrs, { ...slots, default: slots.default ?? (fallback as Slot) });
    },
  }) as unknown as Part;

// Text with its backticks as `code`.
const withCode = (text: string) =>
  codeSpans(text).map((piece, index) => (index % 2 ? h("code", piece) : piece));

/** The bare root, for arranging the parts yourself. */
export const StepGroupRoot = parts.Root;
export const StepGroupTrigger = parts.Trigger;
export const StepGroupIcon = parts.Icon;
export const StepGroupContent = parts.Content;
export const StepGroupChildren = parts.Children;

/** The work in words, with code as `code`, unless you fill the slot. */
export const StepGroupTitle = withDefault<{ title: string }>(parts.Title, "StepGroupTitle", ({ state }) =>
  withCode(state.title),
);

/** "3 of 5", "1 waiting", "1 failed · 41 sec" or the duration, unless you fill the slot. */
export const StepGroupMeta = withDefault<{ meta: string }>(
  parts.Meta,
  "StepGroupMeta",
  ({ state }) => state.meta,
);

/**
 * One line that names a turn's work and opens to the host's own steps. Its default slot holds the steps; to arrange
 * the parts yourself, use `StepGroupRoot`.
 */
export const StepGroup = defineComponent({
  name: "StepGroup",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: () => [
          h(StepGroupTrigger, null, () => [h(StepGroupIcon), h(StepGroupTitle), h(StepGroupMeta)]),
          h(StepGroupContent, null, () => h(StepGroupChildren, null, () => slots.default?.())),
        ],
      });
  },
});
