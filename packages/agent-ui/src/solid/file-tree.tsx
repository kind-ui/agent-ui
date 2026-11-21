import { type FileTreeRow, type FileTreeTreeState, fileTreePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import type { TreeItemData } from "@ui-sdk/solid/tree";
import { For, omit, Show } from "solid-js";
import {
  KindTree,
  KindTreeGroup,
  KindTreeItem,
  KindTreeItemIndicator,
  KindTreeItemLabel,
} from "./internal/tree.js";

const parts = createParts(fileTreePrimitive, {
  root: "div",
  item: "span",
  counts: "span",
  badge: "span",
});

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

export type FileTreeProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: JSX.Element };

/**
 * Changed files as a folder tree: each file shows its change as a badge and its added and removed lines; a folder
 * shows the most significant change inside it as a dot. The arrow keys, Home and End, and typing a name move
 * between rows, as in UI SDK's Tree. Any `children` replace the rows inside the Tree; `FileTreeRows` draws them.
 */
export function FileTree(props: FileTreeProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(tree: FileTreeTreeState) => (
        <KindTree
          controller={tree.controller}
          items={tree.items}
          defaultValue={tree.defaultValue}
          defaultExpanded={tree.defaultExpanded}
          aria-label={tree["aria-label"]}
          hiddenUntilFound={tree.hiddenUntilFound}
        >
          {props.children ?? <FileTreeRows items={tree.items} />}
        </KindTree>
      )}
    </parts.Root>
  );
}

// Every row has an indicator, a file's an empty spacer that lines its name up with a folder's. It's hidden from agents,
// which hides UI SDK's Tree from them (a component with a part under `data-agent-hidden` is off limits) while the rows
// stay the File Tree's.
export type FileTreeRowsProps = { items: TreeItemData[] };

/** A Tree row for each item, with a `FileTreeItem` in its label, and its children in a group. */
export function FileTreeRows(props: FileTreeRowsProps) {
  return (
    <For each={props.items} keyed={(item) => item.value}>
      {(item) => (
        <KindTreeItem value={item().value}>
          <KindTreeItemLabel>
            <KindTreeItemIndicator data-agent-hidden="">
              <Show when={item().children}>
                <Chevron />
              </Show>
            </KindTreeItemIndicator>
            <FileTreeItem value={item().value} />
          </KindTreeItemLabel>
          <Show when={item().children}>
            {(children) => (
              <KindTreeGroup>
                <FileTreeRows items={children()} />
              </KindTreeGroup>
            )}
          </Show>
        </KindTreeItem>
      )}
    </For>
  );
}

export type FileTreeItemProps = ComponentProps<typeof parts.Item>;

/**
 * A row's icon, name, line counts and badge, unless you pass children. Its `value` is the row's path. Spaces between
 * the parts keep their words apart in the row's accessible name.
 */
export function FileTreeItem(props: FileTreeItemProps) {
  return (
    <parts.Item {...omit(props, "children")}>
      {props.children ??
        ((row: FileTreeRow) => (
          <>
            <span data-file-tree-name="">{row.name}</span> <FileTreeCounts /> <FileTreeBadge />
          </>
        ))}
    </parts.Item>
  );
}

export type FileTreeCountsProps = ComponentProps<typeof parts.Counts>;

/** A file's added and removed lines, shown as `+N −N` and read as words. */
export function FileTreeCounts(props: FileTreeCountsProps) {
  return <parts.Counts {...props} />;
}

export type FileTreeBadgeProps = ComponentProps<typeof parts.Badge>;

/** A file's change, shown as a letter like `M` and read as the word, like "modified". */
export function FileTreeBadge(props: FileTreeBadgeProps) {
  return <parts.Badge {...props} />;
}
