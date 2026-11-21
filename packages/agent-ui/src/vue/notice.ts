import { noticePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type Slot, type SlotsType, type VNode } from "vue";

// The root's props and `#render` slot, with plain `default` and `#actions` slots for the notice's content.
type WithActions<C extends abstract new (...args: never) => { $slots: { render?: unknown } }> = new (
  ...args: never
) => Omit<InstanceType<C>, "$slots"> & {
  $slots: { default?: () => VNode[]; actions?: () => VNode[]; render?: InstanceType<C>["$slots"]["render"] };
};

const parts = createParts(noticePrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  description: "div",
  actions: "div",
  dismiss: "button",
});

/** The bare root, for arranging the parts yourself. */
export const NoticeRoot = parts.Root;
export const NoticeIcon = parts.Icon;
export const NoticeDescription = parts.Description;
export const NoticeActions = parts.Actions;
export const NoticeDismiss = parts.Dismiss;

/** The `label`, unless you fill the default slot. Rendered only with a `label`. */
export const NoticeTitle = defineComponent({
  name: "NoticeTitle",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Title, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { label: string } }) => state.label),
      });
  },
}) as unknown as typeof parts.Title;

/**
 * A calm callout: its mark, its `label` as the title, the default slot as its text, then the `#actions` slot and
 * Dismiss while `on-dismiss` is set. To arrange the parts yourself, use `NoticeRoot`.
 */
export const Notice = defineComponent({
  name: "Notice",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => VNode[]; actions?: () => VNode[]; render?: Slot }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        render: slots.render,
        default: () => [
          h(NoticeIcon),
          h(NoticeTitle),
          h(NoticeDescription, null, () => slots.default?.()),
          h(NoticeActions, null, () => slots.actions?.()),
          h(NoticeDismiss),
        ],
      });
  },
}) as unknown as WithActions<typeof parts.Root>;
