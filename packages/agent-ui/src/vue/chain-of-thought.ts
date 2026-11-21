import { type ChainOfThoughtStep, chainOfThoughtPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";

const parts = createParts(chainOfThoughtPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  list: "ol",
  item: "li",
  "item-trigger": "button",
  "item-icon": "span",
  "item-title": "span",
  "item-meta": "span",
  "item-content": "div",
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

export const ChainOfThoughtTrigger = parts.Trigger;
export const ChainOfThoughtIcon = parts.Icon;
export const ChainOfThoughtContent = parts.Content;
export const ChainOfThoughtItemIcon = parts.ItemIcon;
export const ChainOfThoughtItemContent = parts.ItemContent;

/** The `label`, else "N steps", unless you fill the slot. */
export const ChainOfThoughtTitle = withDefault<{ title: string }>(
  parts.Title,
  "ChainOfThoughtTitle",
  ({ state }) => state.title,
);

/** The `durationSeconds`, as "N s", unless you fill the slot. */
export const ChainOfThoughtMeta = withDefault<{ duration: string }>(
  parts.Meta,
  "ChainOfThoughtMeta",
  ({ state }) => state.duration,
);

/** The step's `title`, unless you fill the slot. */
export const ChainOfThoughtItemTitle = withDefault<{ title: string }>(
  parts.ItemTitle,
  "ChainOfThoughtItemTitle",
  ({ state }) => state.title,
);

/** The step's `durationSeconds`, as "N s", unless you fill the slot. */
export const ChainOfThoughtItemMeta = withDefault<{ duration: string }>(
  parts.ItemMeta,
  "ChainOfThoughtItemMeta",
  ({ state }) => state.duration,
);

/** Opens and closes the step's content. Without a default slot, it shows the step's icon, title and duration. */
export const ChainOfThoughtItemTrigger = withDefault(parts.ItemTrigger, "ChainOfThoughtItemTrigger", () => [
  h(ChainOfThoughtItemIcon),
  h(ChainOfThoughtItemTitle),
  h(ChainOfThoughtItemMeta),
]);

/** The step whose `id` is `value`. Without a default slot, it shows the step's trigger. */
export const ChainOfThoughtItem = withDefault(parts.Item, "ChainOfThoughtItem", () =>
  h(ChainOfThoughtItemTrigger),
);

/** An item for each step, unless you fill the slot. */
export const ChainOfThoughtList = withDefault<{ steps: readonly ChainOfThoughtStep[] }>(
  parts.List,
  "ChainOfThoughtList",
  ({ state }) => state.steps.map((step) => h(ChainOfThoughtItem, { key: step.id, value: step.id })),
);

const defaultParts = () => [
  h(ChainOfThoughtTrigger, null, () => [
    h(ChainOfThoughtIcon),
    h(ChainOfThoughtTitle),
    h(ChainOfThoughtMeta),
  ]),
  h(ChainOfThoughtContent, null, () => h(ChainOfThoughtList)),
];

/**
 * A summary of the steps an agent took, which expands into them. A default slot replaces the default trigger and
 * content.
 */
export const ChainOfThought = withDefault(parts.Root, "ChainOfThought", defaultParts);
