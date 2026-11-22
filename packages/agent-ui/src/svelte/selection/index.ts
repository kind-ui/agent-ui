import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Selection from "./Selection.svelte";
import SelectionItem from "./SelectionItem.svelte";
import SelectionToolbar from "./SelectionToolbar.svelte";

/** The bare root, for arranging `SelectionContent` and `SelectionToolbar` yourself. */
export const SelectionRoot = parts.Root;

/** Holds the text a person selects. Put `SelectionToolbar` right after it. */
export const SelectionContent = parts.Content;

export { Selection, SelectionItem, SelectionToolbar };
export type SelectionProps = ComponentProps<typeof Selection>;
export type SelectionToolbarProps = ComponentProps<typeof SelectionToolbar>;
export type SelectionItemProps = ComponentProps<typeof SelectionItem>;
