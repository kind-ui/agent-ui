import { stepGroupPrimitive } from "@kind-ui/agent-ui/core";
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
  cancel: "button",
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

/** The bare root, for arranging the parts yourself. */
export const StepGroupRoot = parts.Root;
export const StepGroupTrigger = parts.Trigger;
export const StepGroupIcon = parts.Icon;
export const StepGroupContent = parts.Content;
export const StepGroupChildren = parts.Children;

/** The `label`, else the summary of `groupLabels`, unless you fill the slot. */
export const StepGroupTitle = withDefault<{ title: string }>(
  parts.Title,
  "StepGroupTitle",
  ({ state }) => state.title,
);

/** "2 running" while steps run, else the duration, unless you fill the slot. */
export const StepGroupMeta = withDefault<{ label: string }>(
  parts.Meta,
  "StepGroupMeta",
  ({ state }) => state.label,
);

/** Calls `onCancel`. Reads "Stop all" unless you fill the slot. Rendered only while the group can be stopped. */
export const StepGroupCancel = withDefault(parts.Cancel, "StepGroupCancel", () => [
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  }),
  "Stop all",
]);

/**
 * One summary row over the host's own steps: their count in words, their status, and "Stop all" while `onCancel`
 * is set and they run. Its default slot holds the steps; to arrange the parts yourself, use `StepGroupRoot`.
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
          h(StepGroupCancel),
        ],
      });
  },
});
