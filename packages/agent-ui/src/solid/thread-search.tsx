import { type PickerTriggerState, threadSearchPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";
import {
  type PickerContentProps,
  type PickerItemProps,
  type PickerListProps,
  type PickerParts,
  type PickerRowItemProps,
  type PickerSectionRowsProps,
  type PickerTriggerProps,
  pickerParts,
} from "./picker.js";

const parts = createParts(threadSearchPrimitive, {
  root: "div",
  trigger: "button",
  backdrop: "div",
  content: "div",
  viewport: "div",
  command: "div",
  item: "span",
  note: "p",
  shortcut: "kbd",
  hints: "div",
  status: "span",
});

// Its parts are Picker's, with state the picker parts never read.
// The status mark ends the row, after the date, since Command hides an item's icon from assistive technology and a
// status needs its words.
const picker = pickerParts(parts as unknown as PickerParts, {
  icon: () => null,
  trailing: (row) => (row.icon === undefined ? null : <ThreadSearchStatus value={row.option.value} />),
});

export type ThreadSearchStatusProps = ComponentProps<typeof parts.Status>;

/** A row's status mark, named in words ("Running"), by its row's `value`. */
export function ThreadSearchStatus(props: ThreadSearchStatusProps) {
  return <parts.Status {...props} />;
}

export type ThreadSearchProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  children?: JSX.Element;
};
export type ThreadSearchTriggerProps = PickerTriggerProps;
export type ThreadSearchBackdropProps = ComponentProps<typeof parts.Backdrop>;
export type ThreadSearchShortcutProps = ComponentProps<typeof parts.Shortcut>;
export type ThreadSearchContentProps = PickerContentProps;
export type ThreadSearchListProps = PickerListProps;
export type ThreadSearchSectionRowsProps = PickerSectionRowsProps;
export type ThreadSearchRowItemProps = PickerRowItemProps;
export type ThreadSearchItemProps = PickerItemProps;

/** The `shortcut`'s keys as this platform shows them, like `⌘K`, unless you pass children. Present only with one. */
export function ThreadSearchShortcut(props: ThreadSearchShortcutProps) {
  return (
    <parts.Shortcut {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Shortcut>
  );
}

/** Opens the dialog. Shows a search icon, the `label` and the `shortcut`'s keys, unless you pass children. */
export function ThreadSearchTrigger(props: ThreadSearchTriggerProps) {
  return (
    <picker.Trigger {...omit(props, "children")}>
      {props.children ??
        ((state: PickerTriggerState) => (
          <>
            <span data-picker-text="">{state.text}</span>
            <ThreadSearchShortcut />
          </>
        ))}
    </picker.Trigger>
  );
}

/** Dims the page beneath the dialog. A press on it closes the dialog. */
export function ThreadSearchBackdrop(props: ThreadSearchBackdropProps) {
  return <parts.Backdrop {...props} />;
}

export type ThreadSearchHintsProps = ComponentProps<typeof parts.Hints>;

/** "↑↓ Navigate", "↵ Open" and "Esc Close" under the list, unless you pass children. Hidden on touch screens. */
export function ThreadSearchHints(props: ThreadSearchHintsProps) {
  return (
    <parts.Hints {...omit(props, "children")}>
      {props.children ?? (
        <>
          <span>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
        </>
      )}
    </parts.Hints>
  );
}

/**
 * The "Search chats" dialog: a button that opens a search over the threads, grouped by date, with "New chat" after
 * them. Choosing a thread calls `onSelect` and closes it. Any `children` replace the trigger and the dialog.
 */
export function ThreadSearch(props: ThreadSearchProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ThreadSearchTrigger />
          <ThreadSearchBackdrop />
          <picker.Content>
            <picker.List />
            <ThreadSearchHints />
          </picker.Content>
        </>
      )}
    </parts.Root>
  );
}

/** The dialog: the search field, the list and the key hints, unless you pass children. Focus moves to the search field. */
export const ThreadSearchContent = picker.Content;
/** UI SDK Command: the search field, its status line, the empty text, and the rows unless you pass children. */
export const ThreadSearchList = picker.List;
/** A group of rows under its label, or the footer. */
export const ThreadSearchSectionRows = picker.SectionRows;
/** A row: UI SDK's `CommandItem` with the row's props, holding its `ThreadSearchItem` unless you pass children. */
export const ThreadSearchRowItem = picker.RowItem;
/** A row's content: its status mark, marked title, snippet and date. */
export const ThreadSearchItem = picker.Item;
