import type { ModelSelectorOptions } from "@kind-ui/agent-ui/core";
import type { Snippet } from "svelte";

/** A model, whose `icon` is an image URL or a snippet such as an inline `svg`. */
export type ModelSelectorModel = Omit<NonNullable<ModelSelectorOptions["models"]>[number], "icon"> & {
  icon?: string | Snippet;
};

export { default as ModelSelectorContent } from "../picker/PickerContent.svelte";
export { default as ModelSelectorItem } from "../picker/PickerItem.svelte";
export { default as ModelSelectorList } from "../picker/PickerList.svelte";
export { default as ModelSelectorRowItem } from "../picker/PickerRowItem.svelte";
export { default as ModelSelectorSectionRows } from "../picker/PickerSectionRows.svelte";
export { default as ModelSelectorTrigger } from "../picker/PickerTrigger.svelte";
export { default as ModelSelector } from "./ModelSelector.svelte";
