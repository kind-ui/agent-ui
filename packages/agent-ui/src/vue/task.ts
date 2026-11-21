import { taskPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";

const parts = createParts(taskPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  list: "ol",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-files": "span",
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

export const TaskTrigger = parts.Trigger;
export const TaskIcon = parts.Icon;
export const TaskContent = parts.Content;
export const TaskItemIcon = parts.ItemIcon;

/** The `label`, else "Task", unless you fill the slot. */
export const TaskTitle = withDefault<{ title: string }>(parts.Title, "TaskTitle", ({ state }) => state.title);

/** How many items are complete, as "2 of 5", unless you fill the slot. */
export const TaskMeta = withDefault<{ done: number; total: number }>(
  parts.Meta,
  "TaskMeta",
  ({ state }) => `${state.done} of ${state.total}`,
);

/** The item's `title`, unless you fill the slot. */
export const TaskItemTitle = withDefault<{ title: string }>(
  parts.ItemTitle,
  "TaskItemTitle",
  ({ state }) => state.title,
);

/** The item's `files`, each as code, unless you fill the slot. Rendered only while the item has files. */
export const TaskItemFiles = withDefault<{ files: string[] }>(parts.ItemFiles, "TaskItemFiles", ({ state }) =>
  // A step can touch one file twice, so files are keyed by place.
  state.files.map((file, index) => h("code", { key: index }, file)),
);

/** The item whose `id` is `value`. Without a default slot, it shows the item's mark, title and files. */
export const TaskItem = withDefault(parts.Item, "TaskItem", () => [
  h(TaskItemIcon),
  h(TaskItemTitle),
  h(TaskItemFiles),
]);

/** An item for each of the `items`, unless you fill the slot. */
export const TaskList = withDefault<{ items: readonly { id: string }[] }>(
  parts.List,
  "TaskList",
  ({ state }) => state.items.map((item) => h(TaskItem, { key: item.id, value: item.id })),
);

const defaultParts = () => [
  h(TaskTrigger, null, () => [h(TaskIcon), h(TaskTitle), h(TaskMeta)]),
  h(TaskContent, null, () => h(TaskList)),
];

/**
 * The steps an agent takes for one task, as it takes them, with how many are done. A default slot replaces the
 * default trigger and content.
 */
export const Task = withDefault(parts.Root, "Task", defaultParts);
