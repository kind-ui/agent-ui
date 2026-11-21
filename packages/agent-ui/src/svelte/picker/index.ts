import type { PickerOptions } from "@kind-ui/agent-ui/core";
import type { Snippet } from "svelte";

/** An item, whose `icon` is an image URL or a snippet such as an inline `svg`. */
export type PickerChoice = Omit<NonNullable<PickerOptions["items"]>[number], "icon" | "items"> & {
  icon?: string | Snippet;
  items?: PickerChoice[];
};

/** A footer action, whose `icon` is an image URL or a snippet. */
export type PickerFooterAction = Omit<NonNullable<PickerOptions["actions"]>[number], "icon"> & {
  icon?: string | Snippet;
};

export { default as Picker } from "./Picker.svelte";
export { default as PickerContent } from "./PickerContent.svelte";
export { default as PickerItem } from "./PickerItem.svelte";
export { default as PickerList } from "./PickerList.svelte";
export { default as PickerRowItem } from "./PickerRowItem.svelte";
export { default as PickerSectionRows } from "./PickerSectionRows.svelte";
export { default as PickerTrigger } from "./PickerTrigger.svelte";
export { type PickerConfig, type PickerParts, setPickerConfig } from "./parts.js";
