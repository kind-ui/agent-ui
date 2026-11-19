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

const DEFAULT_PARTS = `<kind-plan-trigger><button><kind-plan-icon></kind-plan-icon><kind-plan-title></kind-plan-title><kind-plan-meta></kind-plan-meta></button></kind-plan-trigger><kind-plan-content><kind-plan-list></kind-plan-list></kind-plan-content><kind-plan-accept><button><span data-kind-pending-mark data-status-mark data-status="running" aria-hidden="true"></span>Accept plan</button></kind-plan-accept><kind-plan-outcome><kind-plan-outcome-icon></kind-plan-outcome-icon>Accepted</kind-plan-outcome>`;
const PROGRESS_PARTS = `<ui-progress><ui-progress-label></ui-progress-label><ui-progress-track><ui-progress-indicator></ui-progress-indicator></ui-progress-track></ui-progress>`;
const ITEM_PARTS = `<kind-plan-item-icon></kind-plan-item-icon><kind-plan-item-title></kind-plan-item-title><kind-plan-item-description></kind-plan-item-description>`;

// Parts this element wrote text into, and items it added. A part someone wrote text into keeps it, and an item
// someone wrote stays, as React's children do. Kept across instances, because UI SDK rebuilds one when the element
// returns to the page.
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

/**
 * Adds an item for each one the list lacks, in order, removes the items it added for ones that left or that a
 * written item replaced, and fills in every item's parts.
 */
const drawItems = (list: Movable, items: PlanItem[]) => {
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
      child = list.ownerDocument.createElement("kind-plan-item");
      child.setAttribute("value", item.id);
      owned.add(child);
    }
    const before: Element | null = previous ? previous.nextElementSibling : list.firstElementChild;
    if (owned.has(child) && before !== child) move(list, child, before);
    previous = child;
    if (!child.firstElementChild) child.innerHTML = ITEM_PARTS;
    fill(child.querySelector("kind-plan-item-title"), item.title);
    fill(child.querySelector("kind-plan-item-description"), item.description ?? "");
  }
};

/** Fills an empty progress part with a UI SDK Progress, and keeps the one it wrote current. */
const drawProgress = (part: Element | null, { done, total, percent }: PlanState["progress"]) => {
  if (!part || !(owned.has(part) || !part.firstChild)) return;
  if (!owned.has(part)) {
    owned.add(part);
    part.innerHTML = PROGRESS_PARTS;
  }
  const bar = part.querySelector("ui-progress") as (Element & { value: number | null }) | null;
  if (bar && bar.value !== percent) bar.value = percent;
  const label = part.querySelector("ui-progress-label");
  const text = `${done} of ${total} ${total === 1 ? "step" : "steps"}`;
  if (label && label.textContent !== text) label.textContent = text;
};

/**
 * `<kind-plan label="…">` fills in its trigger, content, Accept button and "Accepted" when it has no children, and
 * an empty `kind-plan-progress` you write with a UI SDK Progress. Set `items` as a property: its list gets a
 * `kind-plan-item` for each item it lacks, in order, and every item's empty parts get the item's mark, title and
 * description. Write a `<kind-plan-item value="…">` to render an item yourself. The `can-accept` attribute
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
        const draw = () => {
          const { title, progress, items } = instance.get() as PlanState;
          fill(el.querySelector("kind-plan-title"), title);
          fill(el.querySelector("kind-plan-meta"), `${progress.done} of ${progress.total}`);
          drawProgress(el.querySelector("kind-plan-progress"), progress);
          const list = el.querySelector("kind-plan-list");
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
    outcome: "kind-plan-outcome",
    "outcome-icon": "kind-plan-outcome-icon",
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
    "kind-plan-outcome": HTMLElement;
    "kind-plan-outcome-icon": HTMLElement;
  }
}
