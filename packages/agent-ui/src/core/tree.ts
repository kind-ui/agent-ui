import { type TreeItemData, treeDataNodes, treeFromPaths } from "@ui-sdk/core";
import type { FileTreeEntry } from "../types/index.js";

/** Tree data from file tree entries, through UI SDK's `treeFromPaths`: each item's value is its path. */
export const pathItems = (entries: readonly FileTreeEntry[]): TreeItemData[] =>
  treeFromPaths(entries.map((entry) => entry.path));

/** Every value in tree data, parents before children, split into branches and leaves. */
export const treeValues = (items: readonly TreeItemData[]): { branches: string[]; leaves: string[] } => {
  const branches: string[] = [];
  const leaves: string[] = [];
  for (const node of treeDataNodes(items)) {
    (node.branch ? branches : leaves).push(node.key);
  }
  return { branches, leaves };
};
