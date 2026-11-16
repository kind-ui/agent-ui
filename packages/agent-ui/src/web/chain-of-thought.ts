import {
  type ChainOfThoughtApi,
  type ChainOfThoughtOptions,
  type ChainOfThoughtState,
  chainOfThoughtPrimitive,
  type StepOpenChangeReason,
  stepDuration,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

const DEFAULT_PARTS = `<kind-chain-of-thought-trigger><button><kind-chain-of-thought-icon></kind-chain-of-thought-icon><kind-chain-of-thought-title></kind-chain-of-thought-title><kind-chain-of-thought-meta></kind-chain-of-thought-meta></button></kind-chain-of-thought-trigger><kind-chain-of-thought-content><kind-chain-of-thought-list></kind-chain-of-thought-list></kind-chain-of-thought-content>`;
const ITEM_TRIGGER_PARTS = `<kind-chain-of-thought-item-trigger><button><kind-chain-of-thought-item-icon></kind-chain-of-thought-item-icon><kind-chain-of-thought-item-title></kind-chain-of-thought-item-title><kind-chain-of-thought-item-meta></kind-chain-of-thought-item-meta></button></kind-chain-of-thought-item-trigger>`;

// Parts this element wrote text into, and items it added. A part someone wrote text into keeps it, and an item
// someone wrote stays, as React's children do. Kept across instances, because UI SDK rebuilds one when the element
// returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

/** This element's own part of `selector` under `scope`, not one of a chain nested in a step's content. */
const own = (scope: Element, selector: string, root: Element) =>
  [...scope.querySelectorAll(selector)].find((part) => part.closest("kind-chain-of-thought") === root) ??
  null;

/**
 * Adds an item for each step the list lacks, in order, removes the items it added for steps that left or that a
 * written item replaced, and gives every item without a trigger the default one.
 */
const drawItems = (root: Element, list: Element, { steps }: ChainOfThoughtState) => {
  const items = new Map<string | null, Element>();
  for (const item of list.querySelectorAll(":scope > kind-chain-of-thought-item")) {
    const value = item.getAttribute("value");
    const earlier = items.get(value);
    if (earlier && owned.has(item)) {
      item.remove();
      continue;
    }
    if (earlier && owned.has(earlier)) earlier.remove();
    if (!earlier || owned.has(earlier)) items.set(value, item);
  }
  const ids = new Set<string | null>(steps.map((step) => step.id));
  for (const [id, item] of items) if (owned.has(item) && !ids.has(id)) item.remove();
  let previous: Element | undefined;
  for (const step of steps) {
    let item = items.get(step.id);
    if (!item) {
      item = document.createElement("kind-chain-of-thought-item");
      item.setAttribute("value", step.id);
      owned.add(item);
      if (previous) previous.after(item);
      else list.prepend(item);
    }
    previous = item;
    if (!item.querySelector(":scope > kind-chain-of-thought-item-trigger"))
      item.insertAdjacentHTML("afterbegin", ITEM_TRIGGER_PARTS);
    fill(own(item, "kind-chain-of-thought-item-title", root), step.title);
    fill(own(item, "kind-chain-of-thought-item-meta", root), stepDuration(step.durationSeconds));
  }
};

/**
 * `<kind-chain-of-thought>` fills in its trigger and content when it has no children. Set `steps` as a property: its
 * list gets an item for each step it lacks, and every item without a trigger gets one with the step's icon, title and
 * duration. Write a `<kind-chain-of-thought-item value="…">` with a `<kind-chain-of-thought-item-content>` to give a
 * step content.
 */
export function defineChainOfThought(): void {
  if (customElements.get("kind-chain-of-thought")) return;
  createParts(chainOfThoughtPrimitive, {
    root: {
      tag: "kind-chain-of-thought",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
        openSteps: {
          get: (api) => api.getOpenSteps(),
          set: (api, openSteps) => api.setOpenSteps(openSteps as string[]),
        },
      },
      api: [
        "isOpen",
        "setOpen",
        "expand",
        "collapse",
        "toggle",
        "getOpenSteps",
        "setOpenSteps",
        "isStepOpen",
        "setStepOpen",
        "expandStep",
      ],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        let drawn: ChainOfThoughtState["steps"] | undefined;
        const draw = (force = false) => {
          const state = instance.get() as ChainOfThoughtState;
          fill(own(el, "kind-chain-of-thought-title", el), state.title);
          fill(own(el, "kind-chain-of-thought-meta", el), stepDuration(state.durationSeconds));
          if (state.steps === drawn && !force) return;
          drawn = state.steps;
          const list = own(el, "kind-chain-of-thought-list", el);
          if (list) drawItems(el, list, state);
        };
        draw();
        const unsubscribe = instance.subscribe(() => draw());
        const arrivals = new MutationObserver((records) => {
          // What a step's content holds isn't parts.
          const arrived = records.some(
            (record) =>
              !(
                record.target instanceof Element &&
                record.target.closest("kind-chain-of-thought-item-content")
              ) && [...record.addedNodes].some((node) => node instanceof Element),
          );
          if (arrived) draw(true);
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    trigger: { tag: "kind-chain-of-thought-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-chain-of-thought-icon",
    title: "kind-chain-of-thought-title",
    meta: "kind-chain-of-thought-meta",
    content: "kind-chain-of-thought-content",
    list: "kind-chain-of-thought-list",
    item: "kind-chain-of-thought-item",
    "item-trigger": { tag: "kind-chain-of-thought-item-trigger", target: wrappedButton, display: "contents" },
    "item-icon": "kind-chain-of-thought-item-icon",
    "item-title": "kind-chain-of-thought-item-title",
    "item-meta": "kind-chain-of-thought-item-meta",
    "item-content": "kind-chain-of-thought-item-content",
  });
}

export type KindChainOfThoughtEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  openstepschange: UiChangeEvent<string[], StepOpenChangeReason>;
};

export interface KindChainOfThoughtElement
  extends UiElement<KindChainOfThoughtEvents>,
    AttributeProperties<typeof chainOfThoughtPrimitive, "api" | "open" | "openSteps" | "steps"> {
  open: boolean;
  openSteps: string[];
  steps?: ChainOfThoughtOptions["steps"];
  api: Pick<
    ChainOfThoughtApi,
    | "isOpen"
    | "setOpen"
    | "expand"
    | "collapse"
    | "toggle"
    | "getOpenSteps"
    | "setOpenSteps"
    | "isStepOpen"
    | "setStepOpen"
    | "expandStep"
  >;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-chain-of-thought": KindChainOfThoughtElement;
    "kind-chain-of-thought-trigger": HTMLElement;
    "kind-chain-of-thought-icon": HTMLElement;
    "kind-chain-of-thought-title": HTMLElement;
    "kind-chain-of-thought-meta": HTMLElement;
    "kind-chain-of-thought-content": HTMLElement;
    "kind-chain-of-thought-list": HTMLElement;
    "kind-chain-of-thought-item": UiPartElement<typeof chainOfThoughtPrimitive, "item", "value">;
    "kind-chain-of-thought-item-trigger": HTMLElement;
    "kind-chain-of-thought-item-icon": HTMLElement;
    "kind-chain-of-thought-item-title": HTMLElement;
    "kind-chain-of-thought-item-meta": HTMLElement;
    "kind-chain-of-thought-item-content": HTMLElement;
  }
}
