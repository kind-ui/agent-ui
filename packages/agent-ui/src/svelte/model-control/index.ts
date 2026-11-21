import type { ModelControlOptions } from "@kind-ui/agent-ui/core";
import type { Snippet } from "svelte";

type Icon = string | Snippet;

/** A model, whose `icon` is an image URL or a snippet such as an inline `svg`. */
export type ModelControlModel = Omit<NonNullable<ModelControlOptions["models"]>[number], "icon"> & {
  icon?: Icon;
};

/** An item after the models, like "More models". */
export type ModelControlAction = Omit<NonNullable<ModelControlOptions["actions"]>[number], "icon"> & {
  icon?: Icon;
};

export { default as ModelControl } from "./ModelControl.svelte";
export { default as ModelControlContent } from "./ModelControlContent.svelte";
export { default as ModelControlTrigger } from "./ModelControlTrigger.svelte";
