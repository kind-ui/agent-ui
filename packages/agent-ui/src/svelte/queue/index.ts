import type { ComponentProps } from "svelte";
import { parts } from "./parts.js";
import Queue from "./Queue.svelte";
import QueueInstructions from "./QueueInstructions.svelte";
import QueueItem from "./QueueItem.svelte";
import QueueItemDescription from "./QueueItemDescription.svelte";
import QueueItemTitle from "./QueueItemTitle.svelte";
import QueueList from "./QueueList.svelte";
import QueueSectionTrigger from "./QueueSectionTrigger.svelte";

export {
  Queue,
  QueueInstructions,
  QueueItem,
  QueueItemDescription,
  QueueItemTitle,
  QueueList,
  QueueSectionTrigger,
};
export const QueueSection = parts.Section;
export const QueueSectionContent = parts.SectionContent;
export const QueueItemIcon = parts.ItemIcon;
/** Sends a queued item now, shown while `onSend` is set. Named "Send now"; an arrow unless you pass children. */
export const QueueItemSend = parts.ItemSend;
/** Gives a queued item back to the Composer it's docked in, shown while `onEdit` is set. A pencil unless you pass children. */
export const QueueItemEdit = parts.ItemEdit;
/** Removes an item, shown while `onRemove` is set. An ✕ unless you pass children. */
export const QueueItemRemove = parts.ItemRemove;

export type QueueProps = ComponentProps<typeof Queue>;
export type QueueSectionTriggerProps = ComponentProps<typeof QueueSectionTrigger>;
export type QueueListProps = ComponentProps<typeof QueueList>;
export type QueueItemProps = ComponentProps<typeof QueueItem>;
export type QueueItemTitleProps = ComponentProps<typeof QueueItemTitle>;
export type QueueItemDescriptionProps = ComponentProps<typeof QueueItemDescription>;
export type QueueInstructionsProps = ComponentProps<typeof QueueInstructions>;
