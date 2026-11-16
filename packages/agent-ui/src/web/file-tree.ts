import {
  type FileTreeApi,
  type FileTreeExpandedChangeReason,
  type FileTreeOptions,
  type FileTreeRow,
  type FileTreeSelectReason,
  type FileTreeState,
  type FileTreeValueChangeReason,
  fileTreePrimitive,
} from "@kind-ui/agent-ui/core";
import type { TreeItemData } from "@ui-sdk/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiTreeElement } from "@ui-sdk/web/events";
import { defineInternalTree } from "./internal/tree.js";

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// The row each element was last drawn from, so a redraw writes only rows that changed.
const drawn = new WeakMap<Element, FileTreeRow>();

const element = (document: Document, tag: string, attributes: Record<string, string> = {}, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

// Every row has an indicator, a file's an empty spacer that lines its name up with a folder's. It's hidden from agents,
// which hides UI SDK's Tree from them (a component with a part under `data-agent-hidden` is off limits) while the rows
// stay the File Tree's.
const newRow = (document: Document, value: string) => {
  const row = element(document, "ui-tree-item", { value });
  const label = element(document, "ui-tree-item-label");
  const item = element(document, "kind-file-tree-item", { value });
  // Spaces keep the parts' words apart in the row's accessible name.
  item.append(
    element(document, "span", { "data-file-tree-name": "" }),
    " ",
    element(document, "kind-file-tree-counts"),
    " ",
    element(document, "kind-file-tree-badge"),
  );
  label.append(element(document, "ui-tree-item-indicator", { "data-agent-hidden": "" }), item);
  row.append(label);
  return row;
};

/** Writes a row's name, as text so no name is parsed as markup. */
const drawName = (item: Element, row: FileTreeRow) => {
  if (drawn.get(item) === row) return;
  drawn.set(item, row);
  const name = item.querySelector(":scope > [data-file-tree-name]");
  if (name && name.textContent !== row.name) name.textContent = row.name;
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused row focused where the browser has it; `insertBefore` blurs it.
const place = (parent: Movable, child: Element, before: Element | null) => {
  if (before === child || (child.parentElement === parent && child.nextElementSibling === before)) return;
  if (parent.moveBefore && child.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

/** Draws the rows into a tree or a folder's group, reusing each path's element so focus and open folders stay. */
const drawRows = (parent: Element, items: TreeItemData[], rows: FileTreeState["rows"]) => {
  const document = parent.ownerDocument;
  const existing = new Map<string, Element>();
  for (const row of parent.querySelectorAll(":scope > ui-tree-item"))
    existing.set(row.getAttribute("value") ?? "", row);
  let previous: Element | null = null;
  for (const data of items) {
    const row = existing.get(data.value) ?? newRow(document, data.value);
    existing.delete(data.value);
    const indicator = row.querySelector(":scope > ui-tree-item-label > ui-tree-item-indicator");
    let group = row.querySelector(":scope > ui-tree-group");
    if (data.children) {
      if (indicator && !indicator.firstElementChild) indicator.innerHTML = CHEVRON;
      if (!group) {
        group = element(document, "ui-tree-group");
        row.append(group);
      }
      drawRows(group, data.children, rows);
    } else {
      indicator?.replaceChildren();
      group?.remove();
    }
    const item = row.querySelector(":scope > ui-tree-item-label > kind-file-tree-item");
    const shown = Object.hasOwn(rows, data.value) ? rows[data.value] : undefined;
    if (item && shown) drawName(item, shown);
    place(parent, row, previous ? previous.nextElementSibling : parent.firstElementChild);
    previous = row;
  }
  for (const row of existing.values()) row.remove();
};

/**
 * `<kind-file-tree>` draws its rows from `entries`, set as a property. Selecting fires `pathchange`, opening or closing
 * folders fires `expandchange`, and with `can-select` a press or Enter on a file fires `fileselect`, each with the
 * path or paths as `detail.value`.
 */
export function defineFileTree(): void {
  if (customElements.get("kind-file-tree")) return;
  defineInternalTree();
  createParts(fileTreePrimitive, {
    root: {
      tag: "kind-file-tree",
      kinds: { canSelect: "boolean" },
      // The inner Tree fires `valuechange` and `expandedchange` of its own, which a capture listener would hear first,
      // and a native `select` bubbles from text fields.
      events: { onValueChange: "pathchange", onExpandedChange: "expandchange", onSelect: "fileselect" },
      api: ["getValue", "getExpanded", "expand", "collapse"],
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindFileTreeElement).canSelect ? {} : { onSelect: undefined }),
      render: (el, instance) => {
        const api = instance.api as FileTreeApi;
        const state = instance.get() as FileTreeState;
        // The Tree reads its defaults as it connects, and draws bare rows of its own from `items` when it has none,
        // so it gets both, and our rows, before it connects.
        const tree =
          el.querySelector<UiTreeElement>(":scope > kind-internal-tree > ui-tree") ??
          el.ownerDocument.createElement("ui-tree");
        if (!tree.isConnected) {
          const { "aria-label": label, ...props } = api.treeState(state);
          drawRows(tree, state.items, state.rows);
          Object.assign(tree, props);
          tree.ariaLabel = label;
          const host = el.ownerDocument.createElement("kind-internal-tree");
          host.append(tree);
          el.replaceChildren(host);
        }
        let drawnItems = state.items;
        let drawnRows = state.rows;
        const draw = () => {
          const current = instance.get() as FileTreeState;
          if (current.items !== drawnItems || current.rows !== drawnRows) {
            drawnItems = current.items;
            drawnRows = current.rows;
            drawRows(tree, current.items, current.rows);
          }
          const { "aria-label": label, items } = api.treeState(current);
          if (tree.items !== items) tree.items = items;
          if (tree.ariaLabel !== label) tree.ariaLabel = label;
          api.syncTree();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    item: "kind-file-tree-item",
    counts: "kind-file-tree-counts",
    badge: "kind-file-tree-badge",
  });
}

export type KindFileTreeEvents = {
  pathchange: UiChangeEvent<string | null, FileTreeValueChangeReason>;
  expandchange: UiChangeEvent<string[], FileTreeExpandedChangeReason>;
  fileselect: UiChangeEvent<string, FileTreeSelectReason>;
};

export interface KindFileTreeElement
  extends UiElement<KindFileTreeEvents>,
    AttributeProperties<
      typeof fileTreePrimitive,
      "api" | "entries" | "value" | "defaultValue" | "expanded" | "defaultExpanded"
    > {
  entries?: FileTreeOptions["entries"];
  value?: string | null;
  defaultValue?: string | null;
  expanded?: string[];
  defaultExpanded?: string[];
  /** Whether a press or Enter on a file fires `fileselect`, and agents may `select`. */
  canSelect: boolean;
  api: Pick<FileTreeApi, "getValue" | "getExpanded" | "expand" | "collapse">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-file-tree": KindFileTreeElement;
    "kind-file-tree-item": HTMLElement;
    "kind-file-tree-counts": HTMLElement;
    "kind-file-tree-badge": HTMLElement;
  }
}
