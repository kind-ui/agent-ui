import "@ui-sdk/web/progress";
import {
  type PlanApi,
  type PlanOptions,
  type PlanState,
  planPrimitive,
  type StepOpenChangeReason,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

type PlanItem = PlanState["items"][number];

const DEFAULT_PARTS = `<kind-plan-trigger><button><kind-plan-icon></kind-plan-icon><kind-plan-title></kind-plan-title></button></kind-plan-trigger><kind-plan-progress></kind-plan-progress><kind-plan-content><kind-plan-list></kind-plan-list></kind-plan-content><kind-plan-accept><button>Accept plan</button></kind-plan-accept>`;
const PROGRESS_PARTS = `<ui-progress><ui-progress-label></ui-progress-label><ui-progress-track><ui-progress-indicator></ui-progress-indicator></ui-progress-track></ui-progress>`;
const ITEM_PARTS = `<kind-plan-item-icon></kind-plan-item-icon><kind-plan-item-title></kind-plan-item-title><kind-plan-item-description></kind-plan-item-description>`;

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

function fillItem(el: Element, item: PlanItem): void {
  if (!el.firstElementChild) el.innerHTML = ITEM_PARTS;
  const title = el.querySelector("kind-plan-item-title");
  if (title && title.textContent !== item.title) title.textContent = item.title;
  const description = el.querySelector("kind-plan-item-description");
  const text = item.description ?? "";
  if (description && description.textContent !== text) description.textContent = text;
}

/**
 * `<kind-plan label="…">` fills in its trigger, progress bar, content and Accept button when it has no children,
 * and an empty `kind-plan-progress` with a UI SDK Progress. Set `items` as a property: its list gets a
 * `kind-plan-item` for each, with the item's mark, title and description, in order. The `can-accept` attribute
 * shows Accept, which fires `accept`: call `event.detail.waitUntil(promise)` to keep it pending.
 */
export function definePlan(): void {
  if (customElements.get("kind-plan")) return;
  createParts(planPrimitive, {
    root: {
      tag: "kind-plan",
      kinds: { canAccept: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindPlanElement).canAccept ? {} : { onAccept: undefined }),
      defaults: { agentConfirm: true },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle", "getItems"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const drawn = new WeakMap<Element, PlanItem>();
        const draw = () => {
          const { title, progress, items } = instance.get() as PlanState;
          fill(el.querySelector("kind-plan-title"), title);
          fill(el.querySelector("kind-plan-meta"), `${progress.done} of ${progress.total}`);
          const part = el.querySelector("kind-plan-progress");
          if (part && !part.firstElementChild) part.innerHTML = PROGRESS_PARTS;
          const bar = part?.querySelector("ui-progress") as (Element & { value: number | null }) | null;
          if (bar && bar.value !== progress.percent) bar.value = progress.percent;
          fill(
            part?.querySelector("ui-progress-label") ?? null,
            `${progress.done} of ${progress.total} ${progress.total === 1 ? "step" : "steps"}`,
          );
          const list = el.querySelector("kind-plan-list");
          if (!list) return;
          const existing = new Map([...list.children].map((child) => [child.getAttribute("value"), child]));
          items.forEach((item, index) => {
            let child = existing.get(item.id);
            existing.delete(item.id);
            if (!child) {
              child = document.createElement("kind-plan-item");
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
    trigger: { tag: "kind-plan-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-plan-icon",
    title: "kind-plan-title",
    meta: "kind-plan-meta",
    content: "kind-plan-content",
    progress: "kind-plan-progress",
    list: "kind-plan-list",
    item: "kind-plan-item",
    "item-icon": "kind-plan-item-icon",
    "item-title": "kind-plan-item-title",
    "item-description": "kind-plan-item-description",
    accept: { tag: "kind-plan-accept", target: wrappedButton, display: "contents" },
  });
}

export type KindPlanEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  accept: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindPlanElement
  extends UiElement<KindPlanEvents>,
    AttributeProperties<typeof planPrimitive, "api" | "open" | "items"> {
  open: boolean;
  canAccept: boolean;
  items?: PlanOptions["items"];
  api: Pick<PlanApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle" | "getItems">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-plan": KindPlanElement;
    "kind-plan-trigger": HTMLElement;
    "kind-plan-icon": HTMLElement;
    "kind-plan-title": HTMLElement;
    "kind-plan-meta": HTMLElement;
    "kind-plan-content": HTMLElement;
    "kind-plan-progress": HTMLElement;
    "kind-plan-list": HTMLElement;
    "kind-plan-item": UiPartElement<typeof planPrimitive, "item", "value">;
    "kind-plan-item-icon": HTMLElement;
    "kind-plan-item-title": HTMLElement;
    "kind-plan-item-description": HTMLElement;
    "kind-plan-accept": HTMLElement;
  }
}
