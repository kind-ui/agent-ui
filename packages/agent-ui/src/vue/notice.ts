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
  reset: "p",
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

/** When the limit resets, like "Resets Tuesday at 9:00 AM.", unless you fill the default slot. Rendered only with `resets-at`. */
export const NoticeReset = defineComponent({
  name: "NoticeReset",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Reset, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { text: string } }) => state.text),
      });
  },
}) as unknown as typeof parts.Reset;

/**
 * A calm callout: its mark, its `label` as the title, the reset line with `resets-at`, the default slot as its text,
 * then the `#actions` slot and Dismiss while `on-dismiss` is set and it's `dismissible`. To arrange the parts
 * yourself, use `NoticeRoot`.
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
          h(NoticeReset),
          h(NoticeDescription, null, () => slots.default?.()),
          h(NoticeActions, null, () => slots.actions?.()),
          h(NoticeDismiss),
        ],
      });
  },
}) as unknown as WithActions<typeof parts.Root>;
