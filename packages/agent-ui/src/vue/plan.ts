import { planPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from "@ui-sdk/vue/progress";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";

const parts = createParts(planPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  progress: "div",
  list: "ol",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-description": "span",
  accept: "button",
  outcome: "div",
  "outcome-icon": "span",
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

export const PlanTrigger = parts.Trigger;
export const PlanIcon = parts.Icon;
export const PlanContent = parts.Content;
export const PlanItemIcon = parts.ItemIcon;
export const PlanOutcomeIcon = parts.OutcomeIcon;

/** The `label`, else "Plan", unless you fill the slot. */
export const PlanTitle = withDefault<{ title: string }>(parts.Title, "PlanTitle", ({ state }) => state.title);

/** How many items are done, as "3 of 5", unless you fill the slot. */
export const PlanMeta = withDefault<{ done: number; total: number }>(
  parts.Meta,
  "PlanMeta",
  ({ state }) => `${state.done} of ${state.total}`,
);

/**
 * A UI SDK Progress of the items done, labeled "3 of 5 steps", unless you fill the slot. Not in the default parts,
 * whose meta says the same.
 */
export const PlanProgress = withDefault<{ value: number; label: string }>(
  parts.Progress,
  "PlanProgress",
  ({ state }) =>
    h(Progress, { value: state.value }, () => [
      h(ProgressLabel, null, () => state.label),
      h(ProgressTrack, null, () => h(ProgressIndicator)),
    ]),
);

/** The item's `title`, unless you fill the slot. */
export const PlanItemTitle = withDefault<{ title: string }>(
  parts.ItemTitle,
  "PlanItemTitle",
  ({ state }) => state.title,
);

/** The item's `description`, unless you fill the slot. Rendered only while the item has one. */
export const PlanItemDescription = withDefault<{ description: string }>(
  parts.ItemDescription,
  "PlanItemDescription",
  ({ state }) => state.description,
);

/** The item whose `id` is `value`. Without a default slot, it shows the item's mark, title and description. */
export const PlanItem = withDefault(parts.Item, "PlanItem", () => [
  h(PlanItemIcon),
  h(PlanItemTitle),
  h(PlanItemDescription),
]);

/** An item for each of the `items`, unless you fill the slot. */
export const PlanList = withDefault<{ items: readonly { id: string }[] }>(
  parts.List,
  "PlanList",
  ({ state }) => state.items.map((item) => h(PlanItem, { key: item.id, value: item.id })),
);

/**
 * Calls `onAccept`. Reads "Accept plan", with a running mark while pending, unless you fill the slot. Rendered only
 * while `onAccept` is set and the plan isn't accepted.
 */
export const PlanAccept = withDefault(parts.Accept, "PlanAccept", () => [
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  }),
  "Accept plan",
]);

/** "Accepted" with a complete mark, in Accept's place once the plan is accepted, unless you fill the slot. */
export const PlanOutcome = withDefault(parts.Outcome, "PlanOutcome", () => [h(PlanOutcomeIcon), "Accepted"]);

const defaultParts = () => [
  h(PlanTrigger, null, () => [h(PlanIcon), h(PlanTitle), h(PlanMeta)]),
  h(PlanContent, null, () => h(PlanList)),
  h(PlanAccept),
  h(PlanOutcome),
];

/**
 * The steps an agent plans to take, with how many are done and, while `onAccept` is set, an Accept button that
 * "Accepted" replaces. A default slot replaces the default parts.
 */
export const Plan = withDefault(parts.Root, "Plan", defaultParts);
