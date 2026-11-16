import {
  type StepOpenChangeReason,
  type TaskApi,
  type TaskOptions,
  type TaskState,
  taskPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

type TaskItem = TaskState["items"][number];

const DEFAULT_PARTS = `<kind-task-trigger><button><kind-task-icon></kind-task-icon><kind-task-title></kind-task-title><kind-task-meta></kind-task-meta></button></kind-task-trigger><kind-task-content><kind-task-list></kind-task-list></kind-task-content>`;
const ITEM_PARTS = `<kind-task-item-icon></kind-task-item-icon><kind-task-item-title></kind-task-item-title><kind-task-item-files></kind-task-item-files>`;

// Parts this element wrote text into, and items it added. A part someone wrote text into keeps it, and an item
// someone wrote stays, as React's children do. Kept across instances, because UI SDK rebuilds one when the element
// returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const fillFiles = (part: Element | null, files: string[]) => {
  if (!part || !(owned.has(part) || !part.firstChild)) return;
  owned.add(part);
  if ([...part.children].map((file) => file.textContent).join("\n") === files.join("\n")) return;
  part.replaceChildren(
    ...files.map((name) => {
      const code = part.ownerDocument.createElement("code");
      code.textContent = name;
      return code;
    }),
  );
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused item focused where the browser has it; `insertBefore` blurs it.
function move(list: Movable, item: Element, before: Element | null): void {
  if (list.moveBefore && item.isConnected) list.moveBefore(item, before);
  else list.insertBefore(item, before);
}

/**
 * Adds an item for each one the list lacks, in order, removes the items it added for ones that left or that a
 * written item replaced, and fills in every item's parts.
 */
const drawItems = (list: Movable, items: TaskItem[]) => {
  const children = new Map<string | null, Element>();
  for (const child of [...list.children]) {
    const value = child.getAttribute("value");
    const earlier = children.get(value);
    if (earlier && owned.has(child)) {
      child.remove();
      continue;
    }
    if (earlier && owned.has(earlier)) earlier.remove();
    if (!earlier || owned.has(earlier)) children.set(value, child);
  }
  const ids = new Set<string | null>(items.map((item) => item.id));
  for (const [id, child] of children) if (owned.has(child) && !ids.has(id)) child.remove();
  let previous: Element | null = null;
  for (const item of items) {
    let child = children.get(item.id);
    if (!child) {
      child = list.ownerDocument.createElement("kind-task-item");
      child.setAttribute("value", item.id);
      owned.add(child);
    }
    const before: Element | null = previous ? previous.nextElementSibling : list.firstElementChild;
    if (owned.has(child) && before !== child) move(list, child, before);
    previous = child;
    if (!child.firstElementChild) child.innerHTML = ITEM_PARTS;
    fill(child.querySelector("kind-task-item-title"), item.title);
    fillFiles(child.querySelector("kind-task-item-files"), item.files ?? []);
  }
};

/**
 * `<kind-task label="…">` fills in its trigger and content when it has no children. Set `items` as a property: its
 * list gets a `kind-task-item` for each item it lacks, in order, and every item's empty parts get the item's mark,
 * title and files. Write a `<kind-task-item value="…">` to render an item yourself.
 */
export function defineTask(): void {
  if (customElements.get("kind-task")) return;
  createParts(taskPrimitive, {
    root: {
      tag: "kind-task",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle", "getItems"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const { title, progress, items } = instance.get() as TaskState;
          fill(el.querySelector("kind-task-title"), title);
          fill(el.querySelector("kind-task-meta"), `${progress.done} of ${progress.total}`);
          const list = el.querySelector("kind-task-list");
          if (list) drawItems(list, items);
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // Parts and items written or removed after the element connects redraw it.
        const arrivals = new MutationObserver((records) => {
          const changed = records.some((record) =>
            [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof Element),
          );
          if (changed) draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    trigger: { tag: "kind-task-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-task-icon",
    title: "kind-task-title",
    meta: "kind-task-meta",
    content: "kind-task-content",
    list: "kind-task-list",
    item: "kind-task-item",
    "item-icon": "kind-task-item-icon",
    "item-title": "kind-task-item-title",
    "item-files": "kind-task-item-files",
  });
}

export type KindTaskEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
};

export interface KindTaskElement
  extends UiElement<KindTaskEvents>,
    AttributeProperties<typeof taskPrimitive, "api" | "open" | "items"> {
  open: boolean;
  items?: TaskOptions["items"];
  api: Pick<TaskApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle" | "getItems">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-task": KindTaskElement;
    "kind-task-trigger": HTMLElement;
    "kind-task-icon": HTMLElement;
    "kind-task-title": HTMLElement;
    "kind-task-meta": HTMLElement;
    "kind-task-content": HTMLElement;
    "kind-task-list": HTMLElement;
    "kind-task-item": UiPartElement<typeof taskPrimitive, "item", "value">;
    "kind-task-item-icon": HTMLElement;
    "kind-task-item-title": HTMLElement;
    "kind-task-item-files": HTMLElement;
  }
}
