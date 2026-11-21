import { type FileTreeRow, type FileTreeTreeState, fileTreePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import type { TreeItemData } from "@ui-sdk/vue/tree";
import { type Component, defineComponent, h, type PropType, type Slots } from "vue";
import {
  KindTree,
  KindTreeGroup,
  KindTreeItem,
  KindTreeItemIndicator,
  KindTreeItemLabel,
} from "./internal/tree.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onSelect`, whose presence offers selection, is declared a function prop instead, which `@select` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => fileTreePrimitive(options), fileTreePrimitive, {
    options: { ...fileTreePrimitive.options, onSelect: "action" },
  }),
  "name",
  { value: fileTreePrimitive.name },
) as typeof fileTreePrimitive;

const parts = createParts(primitive, {
  root: "div",
  item: "span",
  counts: "span",
  badge: "span",
});

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const chevron = () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "aria-hidden": "true",
    },
    [h("path", { d: "m9 18 6-6-6-6", "stroke-linecap": "round", "stroke-linejoin": "round" })],
  );

// A part whose default slot falls back to `fallback` when the caller fills none.
function withDefault<C extends Component>(part: C, name: string, fallback: (scope: never) => unknown): C {
  const Part = defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part, attrs, { ...slots, default: slots.default ?? fallback } as Slots);
    },
  });
  return Part as unknown as C;
}

// Every row has an indicator, a file's an empty spacer that lines its name up with a folder's. It's hidden from agents,
// which hides UI SDK's Tree from them (a component with a part under `data-agent-hidden` is off limits) while the rows
// stay the File Tree's.
/** A Tree row for each item, with a `FileTreeItem` in its label, and its children in a group. */
export const FileTreeRows: Component<{ items: TreeItemData[] }> = defineComponent({
  name: "FileTreeRows",
  props: { items: { type: Array as PropType<TreeItemData[]>, required: true } },
  setup(props) {
    return () =>
      props.items.map(({ value, children }) =>
        h(KindTreeItem, { key: value, value }, () => [
          h(KindTreeItemLabel, null, () => [
            h(KindTreeItemIndicator, { "data-agent-hidden": "" }, children ? chevron : undefined),
            h(FileTreeItem, { value }),
          ]),
          children ? h(KindTreeGroup, null, () => h(FileTreeRows, { items: children })) : null,
        ]),
      );
  },
});

/**
 * Changed files as a folder tree: each file shows its change as a badge and its added and removed lines; a folder
 * shows the most significant change inside it as a dot. The arrow keys, Home and End, and typing a name move
 * between rows, as in UI SDK's Tree. A default slot replaces the rows inside the Tree; `FileTreeRows` draws them.
 */
export const FileTree = defineComponent({
  name: "FileTree",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: ({ state }: { state: FileTreeTreeState }) =>
          // The slot's state is a proxy that lists no keys, so the Tree's props are read one by one.
          h(
            KindTree,
            {
              controller: state.controller,
              items: state.items,
              defaultValue: state.defaultValue,
              defaultExpanded: state.defaultExpanded,
              "aria-label": state["aria-label"],
              hiddenUntilFound: state.hiddenUntilFound,
            },
            () => slots.default?.() ?? h(FileTreeRows, { items: state.items }),
          ),
      });
  },
}) as unknown as typeof parts.Root;

/** A file's added and removed lines, shown as `+N −N` and read as words. */
export const FileTreeCounts = parts.Counts;

/** A file's change, shown as a letter like `M` and read as the word, like "modified". */
export const FileTreeBadge = parts.Badge;

/**
 * A row's icon, name, line counts and badge, unless you fill its slot. Its `value` is the row's path. Spaces between
 * the parts keep their words apart in the row's accessible name.
 */
export const FileTreeItem = withDefault(parts.Item, "FileTreeItem", ({ state }: { state: FileTreeRow }) => [
  h("span", { "data-file-tree-name": "" }, state.name),
  " ",
  h(FileTreeCounts),
  " ",
  h(FileTreeBadge),
]);
