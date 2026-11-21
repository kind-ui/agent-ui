import { type GuardrailNoticeState, guardrailNoticePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type SlotsType, type VNode } from "vue";

// The root's own slots, plus `#actions`.
type WithActions<C extends abstract new (...args: never) => object> = new (
  ...args: never
) => InstanceType<C> & { $slots: { actions?: () => VNode[] } };

const parts = createParts(guardrailNoticePrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  reason: "p",
  "detail-trigger": "button",
  detail: "div",
  description: "div",
  actions: "div",
  dismiss: "button",
});

/** The bare root, for arranging the parts yourself. */
export const GuardrailNoticeRoot = parts.Root;
export const GuardrailNoticeIcon = parts.Icon;
export const GuardrailNoticeDescription = parts.Description;
export const GuardrailNoticeActions = parts.Actions;
export const GuardrailNoticeDismiss = parts.Dismiss;

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component>(
  part: C,
  name: string,
  fallback: (state: GuardrailNoticeState) => unknown,
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill });
    },
  }) as unknown as C;
}

/** The `label`, else "Response blocked" or "Response filtered", unless you fill the default slot. */
export const GuardrailNoticeTitle = withDefault(parts.Title, "GuardrailNoticeTitle", ({ label }) => label);
/** The `reason`, unless you fill the default slot. Rendered only with a `reason`. */
export const GuardrailNoticeReason = withDefault(
  parts.Reason,
  "GuardrailNoticeReason",
  ({ reason }) => reason,
);
/** Shows and hides the detail. Reads "Why?" unless you fill the default slot. Rendered only with a `detail`. */
export const GuardrailNoticeDetailTrigger = withDefault(
  parts.DetailTrigger,
  "GuardrailNoticeDetailTrigger",
  () => "Why?",
);
/** The `detail`, unless you fill the default slot. Rendered only with a `detail`; find in page reaches it while hidden. */
export const GuardrailNoticeDetail = withDefault(parts.Detail, "GuardrailNoticeDetail", ({ detail }) =>
  h("p", null, detail),
);

/**
 * A notice that a guardrail blocked or filtered content: its mark and title, the `reason`, "Why?" with the
 * `detail` while there is one, the default slot, then the `#actions` slot and Dismiss while `on-dismiss` is set. To
 * arrange the parts yourself, use `GuardrailNoticeRoot`.
 */
export const GuardrailNotice = defineComponent({
  name: "GuardrailNotice",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => VNode[]; actions?: () => VNode[] }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, () => [
        h(GuardrailNoticeIcon),
        h(GuardrailNoticeTitle),
        h(GuardrailNoticeReason),
        h(GuardrailNoticeDetailTrigger),
        h(GuardrailNoticeDetail),
        slots.default ? h(GuardrailNoticeDescription, null, () => slots.default?.()) : null,
        h(GuardrailNoticeActions, null, () => slots.actions?.()),
        h(GuardrailNoticeDismiss),
      ]);
  },
}) as unknown as WithActions<typeof parts.Root>;
