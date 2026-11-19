import {
  CONTEXT_BAR_FIRST_ITEM,
  type ContextBarApi,
  type ContextBarListState,
  type ContextBarOptions,
  type ContextBarState,
  contextBarPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiChangeEvent,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";

type ContextChip = ContextBarState["rows"][number]["item"];

const DEFAULT_PARTS =
  "<kind-context-bar-list></kind-context-bar-list><kind-context-bar-overflow><button></button></kind-context-bar-overflow><kind-context-bar-content hidden><kind-context-bar-title><h2></h2></kind-context-bar-title><kind-context-bar-overflow-list></kind-context-bar-overflow-list></kind-context-bar-content>";

// Parts this element filled in, and so writes. A part someone wrote keeps its own, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
// Each element's instance, which the content's portal reads to tell how it presents.
const instances = new WeakMap<Element, { get: () => unknown }>();
// The full-screen element each bar's sheet sits in, made the first time it presents as one.
const viewports = new WeakMap<Element, Element>();
// The chip each row was last filled from, so a redraw for another row's change leaves it alone.
const drawn = new WeakMap<Element, ContextChip>();

// A host that sends new chip objects with the same content keeps each row as it is.
const sameChip = (a: ContextChip | undefined, b: ContextChip) =>
  a?.id === b.id && a.label === b.label && a.kind === b.kind && a.icon === b.icon;

// A part written with only whitespace inside, as indented markup is, counts as empty.
const owns = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || (!part.firstElementChild && !part.textContent?.trim()))) return false;
  owned.add(part);
  return true;
};

/** The icon (an image URL or an element, cloned), the label and the remove part, kept bound. */
function fill(row: Element, chip: ContextChip, removeTag: string): void {
  const document = row.ownerDocument;
  const label = document.createElement("span");
  label.setAttribute("data-context-bar-label", "");
  label.textContent = chip.label;
  const remove = row.querySelector(removeTag) ?? document.createElement(removeTag);
  const icon = chip.icon as string | Element | undefined;
  if (icon === undefined) {
    row.replaceChildren(label, remove);
    return;
  }
  const visual = document.createElement("span");
  visual.setAttribute("data-context-bar-icon", "");
  if (typeof icon === "string") {
    const img = document.createElement("img");
    img.alt = "";
    img.src = icon;
    visual.append(img);
  } else visual.append(icon.cloneNode(true));
  row.replaceChildren(visual, label, remove);
}

// Each list's rows by chip id, so drawing reads no attributes.
const rowElements = new WeakMap<Element, Map<string, Element>>();

/** A row per chip, in order, reusing each one's element; dropped rows leave first, so placing the rest never blurs one. */
function drawRows(list: Element, rows: ContextBarListState["rows"], tag: string, removeTag: string): void {
  let byId = rowElements.get(list);
  if (!byId) {
    byId = new Map([...list.children].map((child) => [child.getAttribute("value") ?? "", child]));
    rowElements.set(list, byId);
  }
  const ids = new Set(rows.map(({ item }) => item.id));
  for (const [id, child] of byId)
    if (!ids.has(id)) {
      child.remove();
      byId.delete(id);
    }
  rows.forEach(({ item }, index) => {
    let child = byId.get(item.id);
    if (!child) {
      child = list.ownerDocument.createElement(tag);
      child.setAttribute("value", item.id);
      byId.set(item.id, child);
    }
    if (!sameChip(drawn.get(child), item)) fill(child, item, removeTag);
    drawn.set(child, item);
    if (list.children[index] !== child) list.insertBefore(child, list.children[index] ?? null);
  });
}

/**
 * `<kind-context-bar>` fills in its list, "+N" button and popover when it has no children. Set `chips` as a property:
 * the chips that don't fit go behind "+N". With `can-remove`, Delete, Backspace or a chip's remove control fires
 * `contextremove` with the chip's `id` as `detail.value`.
 */
export function defineContextBar(): void {
  if (customElements.get("kind-context-bar")) return;
  createParts(contextBarPrimitive, {
    root: {
      tag: "kind-context-bar",
      kinds: { canRemove: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindContextBarElement).canRemove ? {} : { onRemove: undefined }),
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      events: { onRemove: "contextremove" },
      // `remove`, `open` and `close` are offered only while available, so they aren't copied onto `api`.
      api: ["isOpen", "setOpen", "getChips"],
      // A sheet sits in a full-screen viewport, which the content moves into while it presents as one.
      portal: {
        slots: ["content"],
        container: (el) => {
          if ((instances.get(el)?.get() as ContextBarState | undefined)?.presentation !== "sheet")
            return null;
          let viewport = viewports.get(el);
          if (!viewport) {
            const created = el.ownerDocument.createElement("kind-context-bar-viewport");
            // It leaves once the content has moved back in place.
            new MutationObserver(() => created.hasChildNodes() || created.remove()).observe(created, {
              childList: true,
            });
            viewports.set(el, created);
            viewport = created;
          }
          if (viewport.parentNode !== el) el.append(viewport);
          return viewport;
        },
      },
      render: (el, instance) => {
        instances.set(el, instance);
        const api = instance.api as ContextBarApi;
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as ContextBarState;
          // As React's `ContextBarContent` places it, unless the author wrote their own, also when it's added later.
          const content = el.querySelector("kind-context-bar-content");
          for (const [name, value] of [
            ["initial-focus", CONTEXT_BAR_FIRST_ITEM],
            ["side-offset", "6"],
            ["align", "end"],
          ] as const)
            if (content && !content.hasAttribute(name)) content.setAttribute(name, value);
          const list = el.querySelector("kind-context-bar-list");
          if (owns(list))
            drawRows(list, api.listState(state).rows, "kind-context-bar-chip", "kind-context-bar-remove");
          const rest = el.querySelector("kind-context-bar-overflow-list");
          if (owns(rest))
            drawRows(
              rest,
              api.overflowState(state).rows,
              "kind-context-bar-item",
              "kind-context-bar-item-remove",
            );
          const button = el.querySelector("kind-context-bar-overflow > button");
          const count = `+${state.overflowCount}`;
          if (owns(button) && state.overflowCount > 0 && button.textContent !== count)
            button.textContent = count;
          const title = el.querySelector("kind-context-bar-title > h2");
          if (owns(title) && title.textContent !== state.label) title.textContent = state.label;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    list: "kind-context-bar-list",
    chip: "kind-context-bar-chip",
    remove: "kind-context-bar-remove",
    overflow: { tag: "kind-context-bar-overflow", target: wrappedButton, display: "contents" },
    content: "kind-context-bar-content",
    viewport: "kind-context-bar-viewport",
    title: { tag: "kind-context-bar-title", target: wrappedChild("h2"), display: "contents" },
    "overflow-list": "kind-context-bar-overflow-list",
    item: "kind-context-bar-item",
    "item-remove": "kind-context-bar-item-remove",
  });
}

type OpenChangeReason = Parameters<NonNullable<ContextBarOptions["onOpenChange"]>>[1]["reason"];

export type KindContextBarEvents = {
  contextremove: UiDetailedChangeEvent<string, Parameters<NonNullable<ContextBarOptions["onRemove"]>>[1]>;
  openchange: UiChangeEvent<boolean, OpenChangeReason>;
};

export interface KindContextBarElement
  extends UiElement<KindContextBarEvents>,
    AttributeProperties<typeof contextBarPrimitive, "api" | "chips" | "open"> {
  /** Each chip's `icon` is an image URL or an element, which each row clones. */
  chips?: readonly (Omit<ContextChip, "icon"> & { icon?: string | Element })[];
  open: boolean;
  /** Whether chips can be removed, each firing `contextremove`. */
  canRemove: boolean;
  focusFallback?: ContextBarOptions["focusFallback"];
  api: Pick<ContextBarApi, "isOpen" | "setOpen" | "getChips">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-context-bar": KindContextBarElement;
    "kind-context-bar-list": HTMLElement;
    "kind-context-bar-chip": UiPartElement<typeof contextBarPrimitive, "chip", "value">;
    "kind-context-bar-remove": HTMLElement;
    "kind-context-bar-item-remove": HTMLElement;
    "kind-context-bar-overflow": HTMLElement;
    "kind-context-bar-content": HTMLElement;
    "kind-context-bar-viewport": HTMLElement;
    "kind-context-bar-title": HTMLElement;
    "kind-context-bar-overflow-list": HTMLElement;
    "kind-context-bar-item": UiPartElement<typeof contextBarPrimitive, "item", "value">;
  }
}
