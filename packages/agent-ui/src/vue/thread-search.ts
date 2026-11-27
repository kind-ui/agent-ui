import { threadSearchPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";
import { type PickerParts, pickerParts } from "./picker.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onSelect` and `onNew`, whose presence offers `select` and "New chat", are declared function props instead, which
// `@select` and `@new` bind.
const primitive = Object.defineProperty(
  Object.assign((options: never) => threadSearchPrimitive(options), threadSearchPrimitive, {
    options: { ...threadSearchPrimitive.options, onSelect: "action", onNew: "action" },
  }),
  "name",
  { value: threadSearchPrimitive.name },
) as typeof threadSearchPrimitive;

const parts = createParts(primitive, {
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

/** A row's status mark, named in words ("Running"), by its row's `value`. */
export const ThreadSearchStatus = parts.Status;

// Its parts are Picker's, with state the picker parts never read.
// The status mark ends the row, after the date, since Command hides an item's icon from assistive technology and a
// status needs its words.
const picker = pickerParts(parts as unknown as PickerParts, "ThreadSearch", {
  icon: () => null,
  trailing: (row) => (row.icon === undefined ? null : h(ThreadSearchStatus, { value: row.option.value })),
});

/** The `shortcut`'s keys as this platform shows them, like `⌘K`, unless you fill the default slot. Present only with one. */
export const ThreadSearchShortcut = defineComponent({
  name: "ThreadSearchShortcut",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Shortcut, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { text: string } }) => state.text),
      });
  },
}) as unknown as typeof parts.Shortcut;

/** Opens the dialog. Shows a search icon, the `label` and the `shortcut`'s keys, unless you fill the default slot. */
export const ThreadSearchTrigger = defineComponent({
  name: "ThreadSearchTrigger",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(picker.Trigger, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: { state: { text: string } }) => [
            h("span", { "data-picker-text": "" }, state.text),
            h(ThreadSearchShortcut),
          ]),
      });
  },
}) as unknown as typeof parts.Trigger;

/** Dims the page beneath the dialog. A press on it closes the dialog. */
export const ThreadSearchBackdrop = parts.Backdrop;

const hints = () => [
  h("span", [h("kbd", "↑↓"), " Navigate"]),
  h("span", [h("kbd", "↵"), " Open"]),
  h("span", [h("kbd", "Esc"), " Close"]),
];

/** "↑↓ Navigate", "↵ Open" and "Esc Close" under the list, unless you fill the default slot. Hidden on touch screens. */
export const ThreadSearchHints = defineComponent({
  name: "ThreadSearchHints",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Hints, attrs, { ...slots, default: slots.default ?? hints });
  },
}) as unknown as typeof parts.Hints;

const defaultParts = () => [
  h(ThreadSearchTrigger),
  h(ThreadSearchBackdrop),
  h(picker.Content, null, () => [h(picker.List), h(ThreadSearchHints)]),
];

/**
 * The "Search chats" dialog: a button that opens a search over the threads, grouped by date, with "New chat" after
 * them. Choosing a thread emits `select` and closes it. A default slot replaces the trigger and the dialog.
 */
export const ThreadSearch = defineComponent({
  name: "ThreadSearch",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;

/** The dialog: the search field, the list and the key hints, unless you fill the default slot. Focus moves to the search field. */
export const ThreadSearchContent = picker.Content;
/** UI SDK Command: the search field, its status line, the empty text, and the rows unless you fill the default slot. */
export const ThreadSearchList = picker.List;
/** A group of rows under its label, or the footer. */
export const ThreadSearchSectionRows = picker.SectionRows;
/** A row: UI SDK's `CommandItem` with the row's props, holding its `ThreadSearchItem` unless you fill the default slot. */
export const ThreadSearchRowItem = picker.RowItem;
/** A row's content: its status mark, marked title, snippet and date. */
export const ThreadSearchItem = picker.Item;
