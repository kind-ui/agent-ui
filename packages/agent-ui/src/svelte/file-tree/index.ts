import type { ComponentProps } from "svelte";
import FileTree from "./FileTree.svelte";
import FileTreeItem from "./FileTreeItem.svelte";
import FileTreeRows from "./FileTreeRows.svelte";
import { parts } from "./parts.js";

/** A file's added and removed lines, shown as `+N −N` and read as words. */
export const FileTreeCounts = parts.Counts;
/** A file's change, shown as a letter like `M` and read as the word, like "modified". */
export const FileTreeBadge = parts.Badge;

export { FileTree, FileTreeItem, FileTreeRows };

export type FileTreeProps = ComponentProps<typeof FileTree>;
export type FileTreeRowsProps = ComponentProps<typeof FileTreeRows>;
export type FileTreeItemProps = ComponentProps<typeof FileTreeItem>;
export type FileTreeCountsProps = ComponentProps<typeof parts.Counts>;
export type FileTreeBadgeProps = ComponentProps<typeof parts.Badge>;
