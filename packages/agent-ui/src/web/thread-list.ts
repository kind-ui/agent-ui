import {
  type ThreadListApi,
  type ThreadListEntry,
  type ThreadListLoadReason,
  type ThreadListMenuContentState,
  type ThreadListOptions,
  type ThreadListReason,
  type ThreadListState,
  threadListPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ActionDetails, ChangeDetails } from "@ui-sdk/core";
import type { AlertDialogOpenChangeReason } from "@ui-sdk/core/alert-dialog";
import type { MenuOpenChangeReason } from "@ui-sdk/core/menu";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiChangeEvent,
  UiDetailedChangeEvent,
  UiElement,
} from "@ui-sdk/web/events";
import { defineInternalAlertDialog } from "./internal/alert-dialog.js";
import { defineInternalMenu, menuElement as element, placeMenuChild as place } from "./internal/menu.js";

const DEFAULT_PARTS = `<kind-thread-list-new><button><span data-thread-list-icon="new" aria-hidden="true"></span>New chat</button></kind-thread-list-new><kind-thread-list-viewport><kind-thread-list-grid><div></div></kind-thread-list-grid><kind-thread-list-end></kind-thread-list-end></kind-thread-list-viewport><kind-thread-list-menu><kind-internal-menu><ui-menu><kind-thread-list-menu-content><ui-menu-content align="end" side-offset="4" data-agent-hidden></ui-menu-content></kind-thread-list-menu-content></ui-menu></kind-internal-menu></kind-thread-list-menu><kind-thread-list-dialog><kind-internal-alert-dialog><ui-alert-dialog><ui-alert-dialog-backdrop hidden></ui-alert-dialog-backdrop><ui-alert-dialog-content hidden><ui-alert-dialog-title></ui-alert-dialog-title><ui-alert-dialog-description></ui-alert-dialog-description><div data-thread-list-answers><kind-thread-list-dialog-error>Couldn't delete. Try again.</kind-thread-list-dialog-error><kind-thread-list-dialog-cancel><button>Cancel</button></kind-thread-list-dialog-cancel><kind-thread-list-dialog-delete><button>Delete</button></kind-thread-list-dialog-delete></div></ui-alert-dialog-content></ui-alert-dialog></kind-internal-alert-dialog></kind-thread-list-dialog>`;

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const ownedOrEmpty = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (ownedOrEmpty(part) && part.textContent !== text) part.textContent = text;
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

// A web popup's `finalFocus` is an attribute, a selector, so it can't hold core's function. The element that function
// picks now carries a marker the selector names instead, one per list and popup, moved on every draw.
const FINAL_FOCUS = "data-thread-list-final-focus";
let lists = 0;
const marks = new WeakMap<Element, { id: number; menu?: Element | null; dialog?: Element | null }>();

const finalFocusSelector = (root: Element, popup: "menu" | "dialog", pick: () => HTMLElement | null) => {
  let own = marks.get(root);
  if (!own) {
    own = { id: ++lists };
    marks.set(root, own);
  }
  const name = `${own.id}-${popup}`;
  const target = pick();
  if (own[popup] !== target) {
    own[popup]?.removeAttribute(FINAL_FOCUS);
    target?.setAttribute(FINAL_FOCUS, name);
    own[popup] = target;
  }
  return `[${FINAL_FOCUS}="${name}"]`;
};

const newHeading = (document: Document, key: string) => {
  const heading = element(document, "kind-thread-list-heading", { value: key });
  heading.append(element(document, "kind-thread-list-heading-cell", { value: key }));
  return heading;
};

const newRow = (document: Document, id: string) => {
  const anchor = element(document, "a");
  anchor.append(
    element(document, "span", { "data-thread-list-title": "" }),
    element(document, "kind-thread-list-status", { value: id }),
    element(document, "kind-thread-list-unread", { value: id }),
  );
  const link = element(document, "kind-thread-list-link", { value: id });
  link.append(anchor);
  const cell = element(document, "kind-thread-list-link-cell", { value: id });
  const editor = element(document, "kind-thread-list-editor", { value: id });
  editor.append(element(document, "input", { type: "text" }));
  cell.append(link, editor);
  const button = element(document, "button");
  button.append(element(document, "span", { "data-thread-list-icon": "more", "aria-hidden": "true" }));
  const more = element(document, "kind-thread-list-more", { value: id });
  more.append(button);
  const moreCell = element(document, "kind-thread-list-more-cell", { value: id });
  moreCell.append(more);
  const row = element(document, "kind-thread-list-row", { value: id });
  row.append(cell, moreCell);
  return row;
};

// The entry each row was last drawn from, so a redraw writes only rows that changed.
const drawnEntries = new WeakMap<Element, ThreadListEntry>();

/** Writes a row's label or title, as text so no title is parsed as markup. */
const drawEntry = (row: Element, entry: ThreadListEntry) => {
  if (drawnEntries.get(row) === entry) return;
  drawnEntries.set(row, entry);
  const text =
    entry.type === "heading"
      ? row.querySelector(":scope > kind-thread-list-heading-cell")
      : row.querySelector("[data-thread-list-title]");
  const value = entry.type === "heading" ? entry.label : entry.thread.title;
  if (text && text.textContent !== value) text.textContent = value;
};

// Each grid's row elements by key, so drawing reads no attributes.
const gridRows = new WeakMap<Element, Map<string, Element>>();

/** Draws a heading or a row for each row in view, reusing each key's element and removing those that left. */
const drawRows = (grid: Element, state: ThreadListState) => {
  const document = grid.ownerDocument;
  const rows = gridRows.get(grid) ?? new Map<string, Element>();
  gridRows.set(grid, rows);
  const wanted = new Set(state.visible.map((item) => item.key));
  // Rows that left go first, so the rest are already in order.
  for (const [key, row] of rows) {
    if (wanted.has(key)) continue;
    row.remove();
    rows.delete(key);
  }
  let previous: Element | null = null;
  for (const item of state.visible) {
    const entry = state.entries[item.key];
    if (!entry) continue;
    let row = rows.get(item.key);
    if (!row) {
      row = entry.type === "heading" ? newHeading(document, item.key) : newRow(document, item.key);
      rows.set(item.key, row);
    }
    drawEntry(row, entry);
    place(grid, row, previous ? previous.nextElementSibling : grid.firstElementChild);
    previous = row;
  }
};

const drawnActions = new WeakMap<Element, ThreadListMenuContentState["actions"]>();

/** Draws a menu item for each action, reusing each value's element, so Pin turning into Unpin keeps the highlight. */
const drawActions = (content: Element, actions: ThreadListMenuContentState["actions"]) => {
  if (drawnActions.get(content) === actions) return;
  drawnActions.set(content, actions);
  const document = content.ownerDocument;
  const items = new Map<string, Element>();
  for (const item of content.querySelectorAll(":scope > ui-menu-item"))
    items.set(item.getAttribute("value") ?? "", item);
  let previous: Element | null = null;
  for (const action of actions) {
    let item = items.get(action.value);
    items.delete(action.value);
    if (!item) {
      item = element(document, "ui-menu-item", { value: action.value });
      item.toggleAttribute("data-destructive", action.value === "delete");
    }
    if (item.textContent !== action.label)
      item.replaceChildren(
        element(document, "span", { "data-thread-list-icon": action.value, "aria-hidden": "true" }),
        action.label,
      );
    place(content, item, previous ? previous.nextElementSibling : content.firstElementChild);
    previous = item;
  }
  for (const item of items.values()) item.remove();
};

const drawnStatus = new WeakMap<Element, ThreadListState["loadStatus"]>();

/** "Loading more chats" with a running mark, or "Couldn't load more chats" and Retry. */
const drawEnd = (end: Element | null, status: ThreadListState["loadStatus"]) => {
  if (!ownedOrEmpty(end) || drawnStatus.get(end) === status) return;
  drawnStatus.set(end, status);
  const document = end.ownerDocument;
  if (status === "loading") {
    end.replaceChildren(
      element(document, "span", { "aria-hidden": "true", "data-status-mark": "", "data-status": "running" }),
      "Loading more chats",
    );
  } else if (status === "error") {
    const retry = element(document, "kind-thread-list-retry");
    retry.append(element(document, "button", {}, "Retry"));
    end.replaceChildren("Couldn't load more chats", retry);
  }
};

type MenuElement = Element & { controller?: unknown; presentation?: unknown; open?: boolean };
type FocusElement = Element & { initialFocus?: unknown; finalFocus?: unknown };
type DialogElement = Element & { controller?: unknown; dismissible?: boolean };

/**
 * `<kind-thread-list>` fills in its parts when it has no children and draws the rows in view into its grid. Set
 * `threads` (and `groupLabels`) as properties. Callbacks are events, each offered by its attribute: `can-select`
 * (`threadselect`, cancel it to route without following the link), `can-new` (`threadnew`), `can-rename`
 * (`threadrename`, with the title as `detail.title`), `can-pin` (`pinchange`), `can-share` (`threadshare`),
 * `can-delete` (`threaddelete`) and `can-load-more` (`loadmore`). Call `event.detail.waitUntil(promise)` on
 * `threadrename` and `threaddelete` to lock renaming, or keep the dialog open, until it settles.
 */
export function defineThreadList(): void {
  if (customElements.get("kind-thread-list")) return;
  defineInternalMenu();
  defineInternalAlertDialog();
  createParts(threadListPrimitive, {
    root: {
      tag: "kind-thread-list",
      // Without it, `confirmDelete = false` reads as a missing attribute, which is the default `true`.
      defaults: { confirmDelete: true },
      kinds: {
        canSelect: "boolean",
        canNew: "boolean",
        canRename: "boolean",
        canPin: "boolean",
        canShare: "boolean",
        canDelete: "boolean",
        canLoadMore: "boolean",
      },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canSelect, canNew, canRename, canPin, canShare, canDelete, canLoadMore } =
          el as KindThreadListElement;
        return {
          ...(!canSelect && { onSelect: undefined }),
          ...(!canNew && { onNew: undefined }),
          ...(!canRename && { onRename: undefined }),
          ...(!canPin && { onPinChange: undefined }),
          ...(!canShare && { onShare: undefined }),
          ...(!canDelete && { onDelete: undefined }),
          ...(!canLoadMore && { onLoadMore: undefined }),
        };
      },
      // Native `select` bubbles from the rename field, and the inner menu and dialog fire events of their own.
      events: {
        onSelect: "threadselect",
        onNew: "threadnew",
        onRename: "threadrename",
        onPinChange: "pinchange",
        onShare: "threadshare",
        onDelete: "threaddelete",
        onLoadMore: "loadmore",
      },
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as ThreadListApi;
        const draw = () => {
          const state = instance.get() as ThreadListState;
          const menu = el.querySelector<MenuElement>("kind-thread-list-menu ui-menu");
          if (menu) {
            const { controller, presentation, open } = api.menu.partState.menu(state);
            write(menu, "controller", controller);
            write(menu, "presentation", presentation);
            // Only a close: the menu opens through the controller with its row's More as the anchor, and writing
            // `open` calls `setOpen`, which would open it again without one, at the page's corner.
            if (!open) write(menu, "open", false);
          }
          const grid = el.querySelector("kind-thread-list-grid > div");
          if (ownedOrEmpty(grid)) drawRows(grid, state);
          const content = el.querySelector<FocusElement>("kind-thread-list-menu-content > ui-menu-content");
          if (content) {
            const { finalFocus, actions } = api.menuContentState(state);
            write(content, "finalFocus", finalFocusSelector(el, "menu", finalFocus));
            if (ownedOrEmpty(content)) drawActions(content, actions);
          }
          const { controller, dismissible, initialFocus, finalFocus, title, description } =
            api.dialogState(state);
          const dialog = el.querySelector<DialogElement>("kind-thread-list-dialog ui-alert-dialog");
          write(dialog, "controller", controller);
          write(dialog, "dismissible", dismissible);
          const dialogContent = el.querySelector<FocusElement>(
            "kind-thread-list-dialog ui-alert-dialog-content",
          );
          write(dialogContent, "initialFocus", initialFocus);
          write(dialogContent, "finalFocus", finalFocusSelector(el, "dialog", finalFocus));
          fill(el.querySelector("kind-thread-list-dialog ui-alert-dialog-title"), title);
          fill(el.querySelector("kind-thread-list-dialog ui-alert-dialog-description"), description);
          drawEnd(el.querySelector("kind-thread-list-end"), state.loadStatus);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    new: { tag: "kind-thread-list-new", target: wrappedButton, display: "contents" },
    viewport: "kind-thread-list-viewport",
    // A native `div`, so the grid is a block as tall as its rows.
    grid: { tag: "kind-thread-list-grid", target: wrappedChild("div"), display: "contents" },
    heading: "kind-thread-list-heading",
    "heading-cell": "kind-thread-list-heading-cell",
    row: "kind-thread-list-row",
    "link-cell": "kind-thread-list-link-cell",
    link: { tag: "kind-thread-list-link", target: wrappedChild("a"), display: "contents" },
    status: "kind-thread-list-status",
    unread: "kind-thread-list-unread",
    editor: { tag: "kind-thread-list-editor", target: wrappedChild("input"), display: "contents" },
    "more-cell": "kind-thread-list-more-cell",
    more: { tag: "kind-thread-list-more", target: wrappedButton, display: "contents" },
    menu: "kind-thread-list-menu",
    "menu-content": { tag: "kind-thread-list-menu-content", display: "contents" },
    dialog: { tag: "kind-thread-list-dialog", display: "contents" },
    "dialog-error": "kind-thread-list-dialog-error",
    "dialog-cancel": { tag: "kind-thread-list-dialog-cancel", target: wrappedButton, display: "contents" },
    "dialog-delete": { tag: "kind-thread-list-dialog-delete", target: wrappedButton, display: "contents" },
    end: "kind-thread-list-end",
    retry: { tag: "kind-thread-list-retry", target: wrappedButton, display: "contents" },
  });
}

export type KindThreadListEvents = {
  threadselect: UiChangeEvent<string, ThreadListReason>;
  threadnew: CustomEvent<{ value: ActionDetails }>;
  threadrename: CustomEvent<
    { value: string } & ActionDetails & { title: string } & Pick<UiActionDetail, "waitUntil">
  >;
  pinchange: UiDetailedChangeEvent<string, ChangeDetails<ThreadListReason> & { pinned: boolean }>;
  threadshare: UiChangeEvent<string, ThreadListReason>;
  threaddelete: CustomEvent<{ value: string } & ActionDetails & Pick<UiActionDetail, "waitUntil">>;
  loadmore: CustomEvent<{ reason: ThreadListLoadReason }>;
  openchange: UiChangeEvent<boolean, MenuOpenChangeReason | AlertDialogOpenChangeReason>;
};

export interface KindThreadListElement
  extends UiElement<KindThreadListEvents>,
    AttributeProperties<typeof threadListPrimitive, "threads" | "groupLabels"> {
  threads?: ThreadListOptions["threads"];
  groupLabels?: ThreadListOptions["groupLabels"];
  /** Whether following a link fires `threadselect`, and agents may `select`. */
  canSelect: boolean;
  /** Shows New chat, which fires `threadnew`. */
  canNew: boolean;
  /** Offers Rename, which fires `threadrename`. */
  canRename: boolean;
  /** Offers Pin and Unpin, which fire `pinchange`. */
  canPin: boolean;
  /** Offers Share, which fires `threadshare`. */
  canShare: boolean;
  /** Offers Delete, which fires `threaddelete`. */
  canDelete: boolean;
  /** Whether nearing the end and Retry fire `loadmore`. */
  canLoadMore: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-thread-list": KindThreadListElement;
    "kind-thread-list-new": HTMLElement;
    "kind-thread-list-viewport": HTMLElement;
    "kind-thread-list-grid": HTMLElement;
    "kind-thread-list-heading": HTMLElement;
    "kind-thread-list-heading-cell": HTMLElement;
    "kind-thread-list-row": HTMLElement;
    "kind-thread-list-link-cell": HTMLElement;
    "kind-thread-list-link": HTMLElement;
    "kind-thread-list-status": HTMLElement;
    "kind-thread-list-unread": HTMLElement;
    "kind-thread-list-editor": HTMLElement;
    "kind-thread-list-more-cell": HTMLElement;
    "kind-thread-list-more": HTMLElement;
    "kind-thread-list-menu": HTMLElement;
    "kind-thread-list-menu-content": HTMLElement;
    "kind-thread-list-dialog": HTMLElement;
    "kind-thread-list-dialog-error": HTMLElement;
    "kind-thread-list-dialog-cancel": HTMLElement;
    "kind-thread-list-dialog-delete": HTMLElement;
    "kind-thread-list-end": HTMLElement;
    "kind-thread-list-retry": HTMLElement;
  }
}
