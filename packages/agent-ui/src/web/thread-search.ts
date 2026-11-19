import {
  type PickerBaseApi,
  type PickerOpenChangeReason,
  type PickerRow,
  type ThreadSearchApi,
  type ThreadSearchOptions,
  type ThreadSearchSelectReason,
  type ThreadSearchState,
  threadSearchPrimitive,
} from "@kind-ui/agent-ui/core";
import type { CommandQueryChangeReason } from "@ui-sdk/core/command";
import { createParts, type RootOptions } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalCommand } from "./internal/command.js";
import { pickerElements } from "./picker.js";

type P = typeof threadSearchPrimitive;

const TAG = "kind-thread-search";

const template = `<${TAG}-trigger><button></button></${TAG}-trigger><${TAG}-backdrop hidden></${TAG}-backdrop><${TAG}-content hidden><${TAG}-command><kind-internal-command><ui-command><ui-command-input><input data-agent-hidden></ui-command-input><ui-command-empty></ui-command-empty><ui-command-list></ui-command-list></ui-command></kind-internal-command></${TAG}-command></${TAG}-content>`;

/** The trigger's label and the `shortcut`'s keys, made once and then only their text written. */
const drawTrigger = (button: Element, state: ThreadSearchState) => {
  const document = button.ownerDocument;
  let text = button.querySelector("[data-picker-text]");
  if (!text) {
    text = document.createElement("span");
    text.setAttribute("data-picker-text", "");
    button.replaceChildren(text, document.createElement(`${TAG}-shortcut`));
  }
  if (text.textContent !== state.label) text.textContent = state.label;
  const shortcut = button.querySelector(`${TAG}-shortcut`);
  if (shortcut && shortcut.textContent !== state.shortcutText) shortcut.textContent = state.shortcutText;
};

const statusMark = (document: Document, row: PickerRow) => {
  const mark = document.createElement(`${TAG}-status`);
  mark.setAttribute("value", row.option.value);
  return [mark];
};

/**
 * `<kind-thread-search>` fills in its trigger and dialog when it has no children. Set `threads` as a property; with
 * `can-select`, choosing a thread fires `threadselect` with its id as `detail.value`, and with `can-new`, "New chat"
 * fires `threadnew` with the search text. Typing fires `querychange`.
 */
export function defineThreadSearch(): void {
  if (customElements.get(TAG)) return;
  defineInternalCommand();
  const elements = pickerElements<P>(
    TAG,
    { onSelect: "threadselect", onNew: "threadnew", onQueryChange: "querychange" },
    {
      template,
      can: { canSelect: "onSelect", canNew: "onNew" },
      state: {
        open: {
          get: (api) => (api as PickerBaseApi).isOpen(),
          set: (api, open) => (api as PickerBaseApi).setOpen(!!open),
        },
      } as RootOptions<P>["state"],
      api: ["isOpen", "setOpen"],
      drawTrigger: (button, state) => drawTrigger(button, state as ThreadSearchState),
      // The status mark follows the title, since Command hides an item's icon from assistive technology and a status
      // needs its words.
      icon: () => [],
      trailing: (document, row) => (row.icon === undefined ? [] : statusMark(document, row)),
      parts: {
        backdrop: `${TAG}-backdrop`,
        shortcut: `${TAG}-shortcut`,
        status: `${TAG}-status`,
      },
    },
  );
  // A `false` property otherwise reads as a missing attribute.
  createParts(threadSearchPrimitive, { ...elements, root: { ...elements.root, defaults: { filter: true } } });
}

export type KindThreadSearchEvents = {
  threadselect: UiChangeEvent<string, ThreadSearchSelectReason>;
  threadnew: UiChangeEvent<string, ThreadSearchSelectReason>;
  querychange: UiChangeEvent<string, CommandQueryChangeReason>;
  openchange: UiChangeEvent<boolean, PickerOpenChangeReason>;
};

export interface KindThreadSearchElement
  extends UiElement<KindThreadSearchEvents>,
    AttributeProperties<P, "api" | "open" | "threads" | "groupLabels"> {
  threads?: ThreadSearchOptions["threads"];
  groupLabels?: ThreadSearchOptions["groupLabels"];
  open: boolean;
  /** Whether a person can choose a thread, which fires `threadselect`. */
  canSelect: boolean;
  /** Whether "New chat" shows, which fires `threadnew`. */
  canNew: boolean;
  api: Pick<ThreadSearchApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-thread-search": KindThreadSearchElement;
    "kind-thread-search-trigger": HTMLElement;
    "kind-thread-search-backdrop": HTMLElement;
    "kind-thread-search-content": HTMLElement;
    "kind-thread-search-viewport": HTMLElement;
    "kind-thread-search-command": HTMLElement;
    "kind-thread-search-item": HTMLElement;
    "kind-thread-search-shortcut": HTMLElement;
    "kind-thread-search-status": HTMLElement;
  }
}
