import { type QueueSectionState, queuePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onReorder` and `onRemove`, whose presence offers moving and removing, are declared function props instead, which
// `@reorder` and `@remove` bind.
const primitive = Object.defineProperty(
  Object.assign((options: never) => queuePrimitive(options), queuePrimitive, {
    options: { ...queuePrimitive.options, onReorder: "action", onRemove: "action" },
  }),
  "name",
  { value: queuePrimitive.name },
) as typeof queuePrimitive;

const parts = createParts(primitive, {
  root: "div",
  section: "div",
  "section-trigger": "button",
  "section-content": "div",
  list: "ul",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-description": "span",
  "item-send": "span",
  "item-remove": "span",
  instructions: "span",
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

export const QueueSection = parts.Section;
export const QueueSectionContent = parts.SectionContent;
export const QueueItemIcon = parts.ItemIcon;
export const QueueItemRemove = parts.ItemRemove;

/** Sends a queued item now, shown while `@send` is bound: "Send now" unless you fill the slot. Pointer only: Ctrl+Enter or Cmd+Enter on the item sends it too. */
export const QueueItemSend = withDefault(parts.ItemSend, "QueueItemSend", () => [
  "Send now",
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  }),
]);

/** The section's title and count, unless you fill the slot. */
export const QueueSectionTrigger = withDefault<QueueSectionState>(
  parts.SectionTrigger,
  "QueueSectionTrigger",
  ({ state }) => [h("span", { "data-title": "" }, state.title), h("span", { "data-count": "" }, state.count)],
);

/** The item's `title`, unless you fill the slot. */
export const QueueItemTitle = withDefault<{ title: string }>(
  parts.ItemTitle,
  "QueueItemTitle",
  ({ state }) => state.title,
);

/** The item's `description`, unless you fill the slot. Hidden while empty. */
export const QueueItemDescription = withDefault<{ description: string }>(
  parts.ItemDescription,
  "QueueItemDescription",
  ({ state }) => state.description,
);

/** The item whose `id` is `value`. Without a default slot, it shows the item's mark, title, description, Send now and remove button. */
export const QueueItem = withDefault(parts.Item, "QueueItem", () => [
  h(QueueItemIcon),
  h("span", { "data-text": "" }, [h(QueueItemTitle), h(QueueItemDescription)]),
  h(QueueItemSend),
  h(QueueItemRemove),
]);

/** An item for each of the section's rows, unless you fill the slot. */
export const QueueList = withDefault<{ rows: readonly { item: { id: string } }[] }>(
  parts.List,
  "QueueList",
  ({ state }) => state.rows.map((row) => h(QueueItem, { key: row.item.id, value: row.item.id })),
);

/** The keys that move and remove items, read with each item and hidden from sight, unless you fill the slot. */
export const QueueInstructions = withDefault<{ text: string }>(
  parts.Instructions,
  "QueueInstructions",
  ({ state }) => state.text,
);

const section = (value: "pending" | "complete") =>
  h(QueueSection, { value }, () => [
    h(QueueSectionTrigger),
    h(QueueSectionContent, null, () => h(QueueList)),
  ]);

const defaultParts = () => [section("pending"), section("complete"), h(QueueInstructions)];

/**
 * The agent's queue: pending items under Queued, complete ones under Completed, each with a count. Moving and removing
 * items are offered while `@reorder` and `@remove` are bound. A default slot replaces the default sections.
 */
export const Queue = withDefault(parts.Root, "Queue", defaultParts);
