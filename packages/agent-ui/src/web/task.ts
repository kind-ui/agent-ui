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

// Parts this element wrote text into. A part someone wrote text into keeps it. Kept across instances, because UI
// SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused item focused where the browser has it; `insertBefore` blurs it.
function move(list: Movable, item: Element, before: Element | null): void {
  if (list.moveBefore && item.isConnected) list.moveBefore(item, before);
  else list.insertBefore(item, before);
}

function fillItem(el: Element, item: TaskItem): void {
  if (!el.firstElementChild) el.innerHTML = ITEM_PARTS;
  const title = el.querySelector("kind-task-item-title");
  if (title && title.textContent !== item.title) title.textContent = item.title;
  const files = el.querySelector("kind-task-item-files");
  const names = item.files ?? [];
  if (files && [...files.children].map((file) => file.textContent).join("\n") !== names.join("\n")) {
    files.replaceChildren(
      ...names.map((name) => {
        const code = document.createElement("code");
        code.textContent = name;
        return code;
      }),
    );
  }
}

/**
 * `<kind-task label="…">` fills in its trigger and content when it has no children. Set `items` as a property: its
 * list gets a `kind-task-item` for each, with the item's mark, title and files, in order.
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
        const drawn = new WeakMap<Element, TaskItem>();
        const draw = () => {
          const { title, progress, items } = instance.get() as TaskState;
          fill(el.querySelector("kind-task-title"), title);
          fill(el.querySelector("kind-task-meta"), `${progress.done} of ${progress.total}`);
          const list = el.querySelector("kind-task-list");
          if (!list) return;
          const existing = new Map([...list.children].map((child) => [child.getAttribute("value"), child]));
          items.forEach((item, index) => {
            let child = existing.get(item.id);
            existing.delete(item.id);
            if (!child) {
              child = document.createElement("kind-task-item");
              child.setAttribute("value", item.id);
            }
            if (drawn.get(child) !== item) {
              fillItem(child, item);
              drawn.set(child, item);
            }
            if (list.children[index] !== child) move(list, child, list.children[index] ?? null);
          });
          for (const child of existing.values()) child.remove();
        };
        draw();
        return instance.subscribe(draw);
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
