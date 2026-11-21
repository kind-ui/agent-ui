import type { ComponentProps } from "svelte";
import ChainOfThought from "./ChainOfThought.svelte";
import ChainOfThoughtItem from "./ChainOfThoughtItem.svelte";
import ChainOfThoughtItemMeta from "./ChainOfThoughtItemMeta.svelte";
import ChainOfThoughtItemTitle from "./ChainOfThoughtItemTitle.svelte";
import ChainOfThoughtItemTrigger from "./ChainOfThoughtItemTrigger.svelte";
import ChainOfThoughtList from "./ChainOfThoughtList.svelte";
import ChainOfThoughtMeta from "./ChainOfThoughtMeta.svelte";
import ChainOfThoughtTitle from "./ChainOfThoughtTitle.svelte";
import { parts } from "./parts.js";

export {
  ChainOfThought,
  ChainOfThoughtItem,
  ChainOfThoughtItemMeta,
  ChainOfThoughtItemTitle,
  ChainOfThoughtItemTrigger,
  ChainOfThoughtList,
  ChainOfThoughtMeta,
  ChainOfThoughtTitle,
};
export const ChainOfThoughtTrigger = parts.Trigger;
export const ChainOfThoughtIcon = parts.Icon;
export const ChainOfThoughtContent = parts.Content;
export const ChainOfThoughtItemIcon = parts.ItemIcon;
export const ChainOfThoughtItemContent = parts.ItemContent;

export type ChainOfThoughtProps = ComponentProps<typeof ChainOfThought>;
export type ChainOfThoughtTitleProps = ComponentProps<typeof ChainOfThoughtTitle>;
export type ChainOfThoughtMetaProps = ComponentProps<typeof ChainOfThoughtMeta>;
export type ChainOfThoughtListProps = ComponentProps<typeof ChainOfThoughtList>;
export type ChainOfThoughtItemProps = ComponentProps<typeof ChainOfThoughtItem>;
export type ChainOfThoughtItemTriggerProps = ComponentProps<typeof ChainOfThoughtItemTrigger>;
export type ChainOfThoughtItemTitleProps = ComponentProps<typeof ChainOfThoughtItemTitle>;
export type ChainOfThoughtItemMetaProps = ComponentProps<typeof ChainOfThoughtItemMeta>;
