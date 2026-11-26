import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Queue from "./Queue.svelte";
import QueueInstructions from "./QueueInstructions.svelte";
import QueueItem from "./QueueItem.svelte";
import QueueItemDescription from "./QueueItemDescription.svelte";
import QueueItemSend from "./QueueItemSend.svelte";
import QueueItemTitle from "./QueueItemTitle.svelte";
import QueueList from "./QueueList.svelte";
import QueueSectionTrigger from "./QueueSectionTrigger.svelte";

export {
  Queue,
  QueueInstructions,
  QueueItem,
  QueueItemDescription,
  QueueItemSend,
  QueueItemTitle,
  QueueList,
  QueueSectionTrigger,
};
export const QueueSection = parts.Section;
export const QueueSectionContent = parts.SectionContent;
export const QueueItemIcon = parts.ItemIcon;
export const QueueItemRemove = parts.ItemRemove;

export type QueueProps = ComponentProps<typeof Queue>;
export type QueueSectionTriggerProps = ComponentProps<typeof QueueSectionTrigger>;
export type QueueListProps = ComponentProps<typeof QueueList>;
export type QueueItemProps = ComponentProps<typeof QueueItem>;
export type QueueItemSendProps = ComponentProps<typeof QueueItemSend>;
export type QueueItemTitleProps = ComponentProps<typeof QueueItemTitle>;
export type QueueItemDescriptionProps = ComponentProps<typeof QueueItemDescription>;
export type QueueInstructionsProps = ComponentProps<typeof QueueInstructions>;
