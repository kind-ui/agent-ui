import type { AddMenuOptions } from "@kind-ui/agent-ui/core";
import type { Snippet } from "svelte";

/** An entry, whose `icon` is an image URL or a snippet such as an inline `svg`. */
export type AddMenuEntry = Omit<NonNullable<AddMenuOptions["items"]>[number], "icon" | "items"> & {
  icon?: string | Snippet;
  items?: AddMenuEntry[];
};

export { default as AddMenu } from "./AddMenu.svelte";
export { default as AddMenuContent } from "./AddMenuContent.svelte";
export { default as AddMenuRows } from "./AddMenuRows.svelte";
export { default as AddMenuTrigger } from "./AddMenuTrigger.svelte";
