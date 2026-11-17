import {
  type SelectionApi,
  type SelectionOptions,
  type SelectionState,
  selectionPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";
import { defineInternalToolbar } from "./internal/toolbar.js";

// Toolbars this element added, and so places and draws the actions of. A toolbar someone wrote keeps its items, as React's
// children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

const createItem = (doc: Document, id: string) => {
  const item = doc.createElement("kind-selection-item");
  item.setAttribute("value", id);
  item.innerHTML = "<ui-toolbar-button><button></button></ui-toolbar-button>";
  return item;
};

/**
 * Draws an item for each action, reusing the item of an action with the same id and moving only what is out of
 * place, so a focused button keeps focus. `moveBefore` doesn't take focus away, where the browser has it.
 */
const drawItems = (bar: Movable, { actions, canRun }: SelectionState) => {
  const items = new Map<string, Element>();
  for (const item of bar.querySelectorAll(":scope > kind-selection-item"))
    items.set(item.getAttribute("value") ?? "", item);
  let previous: Element | null = null;
  for (const { id, label, description } of actions) {
    const item = items.get(id) ?? createItem(bar.ownerDocument, id);
    items.delete(id);
    item.querySelector("ui-toolbar-button")?.toggleAttribute("disabled", !canRun);
    const button = item.querySelector("button");
    if (button) {
      if (button.textContent !== label) button.textContent = label;
      if (description) {
        if (button.title !== description) button.title = description;
      } else button.removeAttribute("title");
    }
    const before: Element | null = previous ? previous.nextElementSibling : bar.firstElementChild;
    if (before !== item) {
      if (bar.moveBefore && item.isConnected) bar.moveBefore(item, before);
      else bar.insertBefore(item, before);
    }
    previous = item;
  }
  for (const item of items.values()) item.remove();
};

/**
 * `<kind-selection can-run>` holds the reply in a `<kind-selection-content>` you write, and adds a
 * `<kind-selection-toolbar>` after it with one button per action. Set `actions` as a property; the `can-run`
 * attribute lets a person choose one, which fires `selectionaction` with `{ actionId, text }` as `detail.value`.
 * Escape or a press outside fires `dismiss` with the selected text. A toolbar you write yourself is
 * `<kind-internal-toolbar><ui-toolbar>` holding `<kind-selection-item value="…"><ui-toolbar-button><button>`s, and
 * keeps what you write in it.
 */
export function defineSelection(): void {
  if (customElements.get("kind-selection")) return;
  defineInternalToolbar();
  createParts(selectionPrimitive, {
    root: {
      tag: "kind-selection",
      kinds: { canRun: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindSelectionElement).canRun ? {} : { onAction: undefined }),
      events: { onAction: "selectionaction" },
      api: ["getActions"],
      render: (el, instance) => {
        let drawn: Pick<SelectionState, "actions" | "label" | "canRun"> | undefined;
        const place = () => {
          const content = el.querySelector(":scope > kind-selection-content");
          let toolbar = el.querySelector(":scope > kind-selection-toolbar");
          if (!toolbar) {
            toolbar = el.ownerDocument.createElement("kind-selection-toolbar");
            toolbar.innerHTML = "<kind-internal-toolbar><ui-toolbar></ui-toolbar></kind-internal-toolbar>";
            owned.add(toolbar);
            drawn = undefined;
          } else if (!owned.has(toolbar) || !content || content.nextElementSibling === toolbar) return;
          // It must follow the content: Tab moves from the content to the toolbar.
          if (content) content.after(toolbar);
          else el.append(toolbar);
        };
        const draw = () => {
          place();
          const state = instance.get() as SelectionState;
          if (
            drawn &&
            drawn.actions === state.actions &&
            drawn.label === state.label &&
            drawn.canRun === state.canRun
          ) {
            return;
          }
          drawn = { actions: state.actions, label: state.label, canRun: state.canRun };
          const toolbar = el.querySelector(":scope > kind-selection-toolbar");
          const bar = toolbar && owned.has(toolbar) ? toolbar.querySelector("ui-toolbar") : null;
          if (!bar) return;
          if (bar.ariaLabel !== state.label) bar.ariaLabel = state.label;
          drawItems(bar, state);
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // The content may arrive after the element connects, as a streamed reply's does.
        const arrivals = new MutationObserver(draw);
        arrivals.observe(el, { childList: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    content: "kind-selection-content",
    toolbar: "kind-selection-toolbar",
    item: { tag: "kind-selection-item", display: "contents" },
  });
}

export type KindSelectionEvents = {
  selectionaction: UiDetailedChangeEvent<
    Parameters<NonNullable<SelectionOptions["onAction"]>>[0],
    Parameters<NonNullable<SelectionOptions["onAction"]>>[1]
  >;
  dismiss: UiDetailedChangeEvent<string, Parameters<NonNullable<SelectionOptions["onDismiss"]>>[1]>;
};

export interface KindSelectionElement
  extends UiElement<KindSelectionEvents>,
    AttributeProperties<typeof selectionPrimitive, "api" | "actions"> {
  canRun: boolean;
  actions?: SelectionOptions["actions"];
  api: Pick<SelectionApi, "getActions">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-selection": KindSelectionElement;
    "kind-selection-content": HTMLElement;
    "kind-selection-toolbar": HTMLElement;
    "kind-selection-item": UiPartElement<typeof selectionPrimitive, "item", "value">;
  }
}
