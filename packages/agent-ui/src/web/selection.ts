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

// Items this element filled in, written empty or added by it, and so draws the action of.
const filled = new WeakSet<Element>();
const ITEM_PARTS = "<ui-toolbar-button><button></button></ui-toolbar-button>";

const createItem = (doc: Document, id: string) => {
  const item = doc.createElement("kind-selection-item");
  item.setAttribute("value", id);
  item.innerHTML = ITEM_PARTS;
  filled.add(item);
  return item;
};

/** Writes the item's action into its button: label, `title` from its description, `disabled` without `can-run`. */
const drawItem = (item: Element, { actionsById, canRun }: SelectionState) => {
  const action = Object.hasOwn(actionsById, item.getAttribute("value") ?? "")
    ? actionsById[item.getAttribute("value") ?? ""]
    : undefined;
  item.querySelector("ui-toolbar-button")?.toggleAttribute("disabled", !canRun);
  const button = item.querySelector("button");
  if (!button) return;
  const label = action?.label ?? "";
  if (button.textContent !== label) button.textContent = label;
  if (action?.description) {
    if (button.title !== action.description) button.title = action.description;
  } else button.removeAttribute("title");
};

/**
 * Draws an item for each action, reusing the item of an action with the same id and moving only what is out of
 * place, so a focused button keeps focus. `moveBefore` doesn't take focus away, where the browser has it.
 */
const drawItems = (bar: Movable, state: SelectionState) => {
  const items = new Map<string, Element>();
  for (const item of bar.querySelectorAll(":scope > kind-selection-item"))
    items.set(item.getAttribute("value") ?? "", item);
  let previous: Element | null = null;
  for (const { id } of state.actions) {
    const item = items.get(id) ?? createItem(bar.ownerDocument, id);
    items.delete(id);
    drawItem(item, state);
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
          if (bar) {
            if (bar.ariaLabel !== state.label) bar.ariaLabel = state.label;
            drawItems(bar, state);
          }
          // Items a page wrote empty are filled in, as React's defaults are.
          for (const item of el.querySelectorAll("kind-selection-item")) {
            if (!filled.has(item) && !item.firstElementChild && !item.textContent?.trim()) {
              item.innerHTML = ITEM_PARTS;
              filled.add(item);
            }
            if (filled.has(item)) drawItem(item, state);
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // The content and written items may arrive after the element connects, as a streamed reply's do.
        const arrivals = new MutationObserver((records) => {
          const arrived = records.some(
            (record) =>
              !(record.target instanceof Element && record.target.closest("kind-selection-content")) &&
              [...record.addedNodes].some((node) => node instanceof Element),
          );
          if (!arrived) return;
          drawn = undefined;
          draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
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
