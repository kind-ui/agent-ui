import type { ContextBarOptions } from "@kind-ui/agent-ui/core";
import type { Snippet } from "svelte";
import { parts } from "./parts.js";

/** A chip, whose `icon` is an image URL or a snippet such as an inline `svg`. */
export type ContextBarChipData = Omit<NonNullable<ContextBarOptions["chips"]>[number], "icon"> & {
  icon?: string | Snippet;
};

/** A chip's remove control in the bar, for the pointer: hidden from assistive technology, which uses Delete. */
export const ContextBarRemove = parts.Remove;
/** A chip's remove control in the list of the rest, as `ContextBarRemove` is in the bar. */
export const ContextBarItemRemove = parts.ItemRemove;

export { default as ContextBar } from "./ContextBar.svelte";
export { default as ContextBarChip } from "./ContextBarChip.svelte";
export { default as ContextBarContent } from "./ContextBarContent.svelte";
export { default as ContextBarItem } from "./ContextBarItem.svelte";
export { default as ContextBarList } from "./ContextBarList.svelte";
export { default as ContextBarOverflow } from "./ContextBarOverflow.svelte";
export { default as ContextBarOverflowList } from "./ContextBarOverflowList.svelte";
export { default as ContextBarTitle } from "./ContextBarTitle.svelte";
