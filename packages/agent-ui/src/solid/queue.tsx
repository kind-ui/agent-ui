import { type QueueSection as QueueSectionValue, queuePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

const parts = createParts(queuePrimitive, {
  root: "div",
  section: "div",
  "section-trigger": "button",
  "section-content": "div",
  list: "ul",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-description": "span",
  "item-send": "span",
  "item-remove": "span",
  instructions: "span",
});

export type QueueProps = ComponentProps<typeof parts.Root>;

/**
 * The agent's queue: pending items under Queued, complete ones under Completed, each with a count. Any `children`
 * replace the default sections.
 */
export function Queue(props: QueueProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const QueueSection = parts.Section;
export const QueueSectionContent = parts.SectionContent;
export const QueueItemIcon = parts.ItemIcon;
export const QueueItemRemove = parts.ItemRemove;

export type QueueItemSendProps = ComponentProps<typeof parts.ItemSend>;

/** Sends a queued item now, shown while `onSend` is set: "Send now" unless you pass children. Pointer only: Enter on the item sends it too. */
export function QueueItemSend(props: QueueItemSendProps) {
  return (
    <parts.ItemSend {...omit(props, "children")}>
      {props.children ?? (
        <>
          Send now
          <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
        </>
      )}
    </parts.ItemSend>
  );
}

export type QueueSectionTriggerProps = ComponentProps<typeof parts.SectionTrigger>;

/** The section's title and count, unless you pass children. */
export function QueueSectionTrigger(props: QueueSectionTriggerProps) {
  return (
    <parts.SectionTrigger {...omit(props, "children")}>
      {props.children ??
        ((state: { title: string; count: number }) => (
          <>
            <span data-title="">{state.title}</span>
            <span data-count="">{state.count}</span>
          </>
        ))}
    </parts.SectionTrigger>
  );
}

export type QueueListProps = ComponentProps<typeof parts.List>;

/** An item for each of the section's rows, unless you pass children. */
export function QueueList(props: QueueListProps) {
  return (
    <parts.List {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.rows} keyed={(row) => row.item.id}>
            {(row) => <QueueItem value={row().item.id} />}
          </For>
        ))}
    </parts.List>
  );
}

export type QueueItemProps = ComponentProps<typeof parts.Item>;

/** The item whose `id` is `value`. Without children, it shows the item's mark, title, description and remove button. */
export function QueueItem(props: QueueItemProps) {
  return <parts.Item {...omit(props, "children")}>{props.children ?? <DefaultItemParts />}</parts.Item>;
}

export type QueueItemTitleProps = ComponentProps<typeof parts.ItemTitle>;

/** The item's `title`, unless you pass children. */
export function QueueItemTitle(props: QueueItemTitleProps) {
  return (
    <parts.ItemTitle {...omit(props, "children")}>
      {props.children ?? ((state: { title: string }) => state.title)}
    </parts.ItemTitle>
  );
}

export type QueueItemDescriptionProps = ComponentProps<typeof parts.ItemDescription>;

/** The item's `description`, unless you pass children. Hidden while empty. */
export function QueueItemDescription(props: QueueItemDescriptionProps) {
  return (
    <parts.ItemDescription {...omit(props, "children")}>
      {props.children ?? ((state: { description: string }) => state.description)}
    </parts.ItemDescription>
  );
}

export type QueueInstructionsProps = ComponentProps<typeof parts.Instructions>;

/** The keys that move and remove items, read with each item and hidden from sight, unless you pass children. */
export function QueueInstructions(props: QueueInstructionsProps) {
  return (
    <parts.Instructions {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Instructions>
  );
}

function DefaultItemParts() {
  return (
    <>
      <QueueItemIcon />
      <span data-text="">
        <QueueItemTitle />
        <QueueItemDescription />
      </span>
      <QueueItemSend />
      <QueueItemRemove />
    </>
  );
}

function DefaultSection(props: { value: QueueSectionValue }) {
  return (
    <QueueSection value={props.value}>
      <QueueSectionTrigger />
      <QueueSectionContent>
        <QueueList />
      </QueueSectionContent>
    </QueueSection>
  );
}

function DefaultParts() {
  return (
    <>
      <DefaultSection value="pending" />
      <DefaultSection value="complete" />
      <QueueInstructions />
    </>
  );
}
