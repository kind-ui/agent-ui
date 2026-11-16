import {
  type QueueOptions,
  type QueueSection,
  type QueueState,
  queueInstructions,
  queuePrimitive,
  queueRows,
  queueSection,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";

type QueueItem = QueueState["items"][number];

const SECTIONS: QueueSection[] = ["pending", "complete"];

const section = (value: QueueSection) =>
  `<kind-queue-section value="${value}"><kind-queue-section-trigger><button><span data-title></span><span data-count></span></button></kind-queue-section-trigger><kind-queue-section-content><kind-queue-list></kind-queue-list></kind-queue-section-content></kind-queue-section>`;
const DEFAULT_PARTS = `${SECTIONS.map(section).join("")}<kind-queue-instructions></kind-queue-instructions>`;
const ITEM_PARTS = `<kind-queue-item-icon></kind-queue-item-icon><span data-text><kind-queue-item-title></kind-queue-item-title><kind-queue-item-description></kind-queue-item-description></span><kind-queue-item-remove></kind-queue-item-remove>`;

const write = (el: Element | null, text: string) => {
  if (el && el.textContent !== text) el.textContent = text;
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused item focused where the browser has it; `insertBefore` blurs it.
function move(list: Movable, item: Element, before: Element | null): void {
  if (list.moveBefore && item.isConnected) list.moveBefore(item, before);
  else list.insertBefore(item, before);
}

// Each list keeps only its own section's rows, so an item that completes gets a new element under Completed, as in
// React.
function drawList(list: Movable, items: QueueItem[], drawn: WeakMap<Element, QueueItem>): void {
  const existing = new Map([...list.children].map((child) => [child.getAttribute("value"), child]));
  items.forEach((item, index) => {
    let child = existing.get(item.id);
    existing.delete(item.id);
    if (!child) {
      child = list.ownerDocument.createElement("kind-queue-item");
      child.setAttribute("value", item.id);
      child.innerHTML = ITEM_PARTS;
    }
    if (drawn.get(child) !== item) {
      write(child.querySelector("kind-queue-item-title"), item.title);
      write(child.querySelector("kind-queue-item-description"), item.description ?? "");
      drawn.set(child, item);
    }
    if (list.children[index] !== child) move(list, child, list.children[index] ?? null);
  });
  for (const child of existing.values()) child.remove();
}

/**
 * `<kind-queue label="…">` fills in its Queued and Completed sections and renders a `kind-queue-item` for each
 * entry of its `items` property. The `can-reorder` and `can-remove` attributes let people move and remove items,
 * firing `reorder` (with `event.detail.index`) and `remove`, each with the item's id as `event.detail.value`.
 */
export function defineQueue(): void {
  if (customElements.get("kind-queue")) return;
  createParts(queuePrimitive, {
    root: {
      tag: "kind-queue",
      kinds: { canReorder: "boolean", canRemove: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canReorder, canRemove } = el as KindQueueElement;
        return { ...(!canReorder && { onReorder: undefined }), ...(!canRemove && { onRemove: undefined }) };
      },
      api: ["getItems", "toggleSection"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const drawn = new WeakMap<Element, QueueItem>();
        const draw = () => {
          const state = instance.get() as QueueState;
          for (const value of SECTIONS) {
            const part = el.querySelector(`kind-queue-section[value="${value}"]`);
            if (!part) continue;
            const { title, count } = queueSection(state, value);
            write(part.querySelector("[data-title]"), title);
            write(part.querySelector("[data-count]"), String(count));
            const list = part.querySelector("kind-queue-list");
            const rows = queueRows(state.rows, state.moving, value).map((row) => row.item);
            if (list) drawList(list, rows, drawn);
          }
          write(el.querySelector("kind-queue-instructions"), queueInstructions(state));
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    section: "kind-queue-section",
    "section-trigger": { tag: "kind-queue-section-trigger", target: wrappedButton, display: "contents" },
    "section-content": "kind-queue-section-content",
    list: "kind-queue-list",
    item: "kind-queue-item",
    "item-icon": "kind-queue-item-icon",
    "item-title": "kind-queue-item-title",
    "item-description": "kind-queue-item-description",
    "item-remove": "kind-queue-item-remove",
    instructions: "kind-queue-instructions",
  });
}

export type KindQueueEvents = {
  reorder: UiDetailedChangeEvent<string, Parameters<NonNullable<QueueOptions["onReorder"]>>[1]>;
  remove: UiDetailedChangeEvent<string, Parameters<NonNullable<QueueOptions["onRemove"]>>[1]>;
};

export interface KindQueueElement
  extends UiElement<KindQueueEvents>,
    AttributeProperties<typeof queuePrimitive, "items"> {
  canReorder: boolean;
  canRemove: boolean;
  items?: QueueOptions["items"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-queue": KindQueueElement;
    "kind-queue-section": UiPartElement<typeof queuePrimitive, "section", "value">;
    "kind-queue-section-trigger": HTMLElement;
    "kind-queue-section-content": HTMLElement;
    "kind-queue-list": HTMLElement;
    "kind-queue-item": UiPartElement<typeof queuePrimitive, "item", "value">;
    "kind-queue-item-icon": HTMLElement;
    "kind-queue-item-title": HTMLElement;
    "kind-queue-item-description": HTMLElement;
    "kind-queue-item-remove": HTMLElement;
    "kind-queue-instructions": HTMLElement;
  }
}
