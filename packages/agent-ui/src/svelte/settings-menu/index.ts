import type { SettingsMenuOptions } from "@kind-ui/agent-ui/core";
import type { Snippet } from "svelte";

type Entry = NonNullable<SettingsMenuOptions["settings"]>[number];
type Choice = Extract<Entry, { type: "choice" }>;
type Icon = string | Snippet;

/** A setting, whose `icon` and options' `icon`s are image URLs or snippets such as an inline `svg`. */
export type SettingsMenuSetting =
  | (Extract<Entry, { type: "toggle" }> & { icon?: Icon })
  | (Omit<Choice, "options"> & { icon?: Icon; options: (Choice["options"][number] & { icon?: Icon })[] });

export { default as SettingsMenu } from "./SettingsMenu.svelte";
export { default as SettingsMenuContent } from "./SettingsMenuContent.svelte";
export { default as SettingsMenuRows } from "./SettingsMenuRows.svelte";
export { default as SettingsMenuTrigger } from "./SettingsMenuTrigger.svelte";
