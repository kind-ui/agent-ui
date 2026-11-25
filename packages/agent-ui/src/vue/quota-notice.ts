import { type QuotaNoticeMeterState, quotaNoticePrimitive } from "@kind-ui/agent-ui/core";
import { Meter, MeterIndicator, MeterTrack, MeterValue } from "@ui-sdk/vue/meter";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type SlotsType, type VNode } from "vue";

// The root's props and `#render` slot, with plain `default` and `#actions` slots for the notice's content.
type WithActions<C extends abstract new (...args: never) => { $slots: { render?: unknown } }> = new (
  ...args: never
) => Omit<InstanceType<C>, "$slots"> & {
  $slots: { default?: () => VNode[]; actions?: () => VNode[]; render?: InstanceType<C>["$slots"]["render"] };
};

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onUpgrade`, whose presence offers Upgrade, is declared a function prop instead, which `@upgrade` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => quotaNoticePrimitive(options), quotaNoticePrimitive, {
    options: { ...quotaNoticePrimitive.options, onUpgrade: "action" },
  }),
  "name",
  { value: quotaNoticePrimitive.name },
) as typeof quotaNoticePrimitive;

const parts = createParts(primitive, {
  root: "div",
  icon: "span",
  title: "p",
  meter: "div",
  reset: "p",
  description: "div",
  actions: "div",
  upgrade: "button",
  dismiss: "button",
});

/** The bare root, for arranging the parts yourself. */
export const QuotaNoticeRoot = parts.Root;
export const QuotaNoticeIcon = parts.Icon;
export const QuotaNoticeDescription = parts.Description;
export const QuotaNoticeActions = parts.Actions;
export const QuotaNoticeDismiss = parts.Dismiss;

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component, State>(part: C, name: string, fallback: (state: State) => unknown) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill });
    },
  }) as unknown as C;
}

/** The `label`, else how much is used, unless you fill the default slot. */
export const QuotaNoticeTitle = withDefault(
  parts.Title,
  "QuotaNoticeTitle",
  ({ label }: { label: string }) => label,
);

/** UI SDK's Meter: a bar and the amounts, unless you fill the default slot, which gets the Meter's props as `state`. */
export const QuotaNoticeMeter = withDefault(parts.Meter, "QuotaNoticeMeter", (state: QuotaNoticeMeterState) =>
  h(
    Meter,
    {
      value: state.value,
      max: state.max,
      locale: state.locale,
      format: state.format,
      getValueLabel: state.getValueLabel,
      "aria-label": state.label,
      "data-agent-hidden": "",
    },
    () => [h(MeterTrack, null, () => h(MeterIndicator)), h(MeterValue)],
  ),
);

/** "Resets in 3 days", unless you fill the default slot. Rendered only with a `resetAt`. */
export const QuotaNoticeReset = withDefault(
  parts.Reset,
  "QuotaNoticeReset",
  ({ text }: { text: string }) => text,
);

/** Calls `onUpgrade`. Reads the `upgradeLabel` unless you fill the default slot. Rendered only with `onUpgrade`. */
export const QuotaNoticeUpgrade = withDefault(
  parts.Upgrade,
  "QuotaNoticeUpgrade",
  ({ label }: { label: string }) => label,
);

/**
 * A notice about a quota: its mark and title, a bar with the amounts in words, when it resets, the default slot, then
 * Upgrade while `onUpgrade` is set, the `#actions` slot and Dismiss while `on-dismiss` is set. To arrange the parts
 * yourself, use `QuotaNoticeRoot`.
 */
export const QuotaNotice = defineComponent({
  name: "QuotaNotice",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => VNode[]; actions?: () => VNode[]; render?: Slot }>,
  setup(_, { attrs, slots }) {
    // `attrs` can't show the root's required `used` and `limit`, which the caller passes through it.
    return () =>
      h(parts.Root as Component, attrs, {
        render: slots.render,
        default: () => [
          h(QuotaNoticeIcon),
          h(QuotaNoticeTitle),
          h(QuotaNoticeMeter),
          h(QuotaNoticeReset),
          slots.default ? h(QuotaNoticeDescription, null, () => slots.default?.()) : null,
          h(QuotaNoticeActions, null, () => [h(QuotaNoticeUpgrade), ...(slots.actions?.() ?? [])]),
          h(QuotaNoticeDismiss),
        ],
      });
  },
}) as unknown as WithActions<typeof parts.Root>;
