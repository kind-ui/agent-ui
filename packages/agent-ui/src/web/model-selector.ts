import {
  type ModelSelectorApi,
  type ModelSelectorContentState,
  type ModelSelectorItem,
  type ModelSelectorOptions,
  type ModelSelectorState,
  type ModelSelectorValueChangeReason,
  modelSelectorPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalCombobox } from "./internal/combobox.js";

// Lucide "chevron-down" and "check", see THIRD_PARTY_NOTICES.md.
const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DEFAULT_PARTS = `<kind-internal-combobox><ui-combobox><kind-model-selector-trigger><kind-model-selector-input><ui-combobox-input><input data-agent-hidden></ui-combobox-input></kind-model-selector-input><span data-model-selector-group></span><ui-combobox-trigger><button>${CHEVRON}</button></ui-combobox-trigger></kind-model-selector-trigger><kind-model-selector-content><ui-combobox-content hidden side-offset="6" align="start"><ui-combobox-empty>No models found.</ui-combobox-empty><ui-combobox-list></ui-combobox-list></ui-combobox-content></kind-model-selector-content></ui-combobox></kind-internal-combobox>`;

// Fields and lists this element filled in, and so writes. A part someone wrote keeps its own, as React's children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
// The content each list was last drawn from, so a redraw for another part's change leaves it alone.
const drawn = new WeakMap<Element, ModelSelectorContentState>();

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

const element = (document: Document, tag: string, attributes: Record<string, string> = {}, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

/** A model's text, built from its data so no name is parsed as markup. */
const itemText = (document: Document, model: ModelSelectorItem) => {
  const name = element(document, "span", { "data-model-selector-name": "" });
  name.append(
    ...model.segments.map((segment) =>
      segment.match ? element(document, "mark", {}, segment.text) : segment.text,
    ),
  );
  const text = element(document, "span", { "data-model-selector-item-text": "" });
  text.append(name);
  if (model.description)
    text.append(element(document, "span", { "data-model-selector-description": "" }, model.description));
  return text;
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// Moves only what is out of place: the Combobox works out a group's visibility as its items connect, so a group or
// item that reconnects needlessly can lose it. `moveBefore` doesn't reconnect, where the browser has it.
const place = (parent: Movable, child: Element, before: Element | null) => {
  if (before === child || (child.parentElement === parent && child.nextElementSibling === before)) return;
  if (parent.moveBefore && child.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

/** Draws the groups and models into the list, reusing their elements so the highlight stays where it is. */
const drawList = (list: Element, content: ModelSelectorContentState) => {
  const document = list.ownerDocument;
  const groups = new Map<string, Element>();
  for (const group of list.querySelectorAll(":scope > ui-combobox-group"))
    groups.set(group.getAttribute("data-group") ?? "", group);
  const items = new Map<string, Element>();
  for (const item of list.querySelectorAll("ui-combobox-item"))
    items.set(item.getAttribute("value") ?? "", item);
  let previousGroup: Element | null = null;
  for (const { group, models } of content.groups) {
    let groupEl = groups.get(group ?? "");
    groups.delete(group ?? "");
    if (!groupEl) {
      groupEl = element(document, "ui-combobox-group", { "data-group": group ?? "" });
      if (group) groupEl.append(element(document, "ui-combobox-group-label", {}, group));
    }
    let previous = groupEl.querySelector(":scope > ui-combobox-group-label");
    for (const model of models) {
      let item = items.get(model.id);
      items.delete(model.id);
      if (!item) {
        item = element(document, "ui-combobox-item", { value: model.id });
        item.innerHTML = `<ui-combobox-item-indicator>${CHECK}</ui-combobox-item-indicator>`;
      }
      item.setAttribute("label", model.name);
      item.toggleAttribute("disabled", Boolean(model.disabled));
      const text = item.querySelector(":scope > [data-model-selector-item-text]");
      if (text) text.replaceWith(itemText(document, model));
      else item.prepend(itemText(document, model));
      place(groupEl, item, previous ? previous.nextElementSibling : groupEl.firstElementChild);
      previous = item;
    }
    place(list, groupEl, previousGroup ? previousGroup.nextElementSibling : list.firstElementChild);
    previousGroup = groupEl;
  }
  for (const item of items.values()) item.remove();
  for (const group of groups.values()) group.remove();
};

/**
 * `<kind-model-selector>` fills in its field and list when it has no children. Set `models` and `value` as
 * properties; choosing a model fires `modelchange` with its id as `detail.value`.
 */
export function defineModelSelector(): void {
  if (customElements.get("kind-model-selector")) return;
  defineInternalCombobox();
  createParts(modelSelectorPrimitive, {
    root: {
      tag: "kind-model-selector",
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue(String(value)),
        },
      },
      // The inner Combobox fires a `valuechange` of its own, which a capture listener would hear first.
      events: { onValueChange: "modelchange" },
      api: ["getValue", "setValue"],
      render: (el, instance) => {
        if (!el.firstElementChild) {
          el.innerHTML = DEFAULT_PARTS;
          for (const part of el.querySelectorAll("kind-model-selector-trigger, ui-combobox-list"))
            owned.add(part);
        }
        const api = instance.api as ModelSelectorApi;
        const draw = () => {
          const state = instance.get() as ModelSelectorState;
          const combobox = api.comboboxState(state);
          const root = el.querySelector<Element & Record<string, unknown>>("ui-combobox");
          if (root) for (const [key, value] of Object.entries(combobox)) write(root, key, value);
          const trigger = el.querySelector("kind-model-selector-trigger");
          if (trigger && owned.has(trigger)) {
            const input = trigger.querySelector<HTMLInputElement>("kind-model-selector-input input");
            write(input, "ariaLabel", state.label);
            write(input, "placeholder", state.placeholder);
            write(
              trigger.querySelector<HTMLButtonElement>("ui-combobox-trigger button"),
              "ariaLabel",
              state.openLabel,
            );
            const group = trigger.querySelector("[data-model-selector-group]");
            const selected = state.models.find((model) => model.id === state.value);
            if (group && group.textContent !== (selected?.group ?? ""))
              group.textContent = selected?.group ?? "";
          }
          const list = el.querySelector("kind-model-selector-content ui-combobox-list");
          const content = api.contentState(state);
          if (list && owned.has(list) && drawn.get(list) !== content) {
            drawn.set(list, content);
            drawList(list, content);
          }
          api.syncValue();
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        return unsubscribe;
      },
    },
    trigger: "kind-model-selector-trigger",
    input: { tag: "kind-model-selector-input", display: "contents" },
    content: { tag: "kind-model-selector-content", display: "contents" },
  });
}

export type KindModelSelectorEvents = {
  modelchange: UiChangeEvent<string | null, ModelSelectorValueChangeReason>;
};

export interface KindModelSelectorElement
  extends UiElement<KindModelSelectorEvents>,
    AttributeProperties<typeof modelSelectorPrimitive, "api" | "models" | "value" | "defaultValue"> {
  models?: ModelSelectorOptions["models"];
  get value(): string | null;
  set value(id: string);
  defaultValue?: string | null;
  api: Pick<ModelSelectorApi, "getValue" | "setValue">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-model-selector": KindModelSelectorElement;
    "kind-model-selector-trigger": HTMLElement;
    "kind-model-selector-input": HTMLElement;
    "kind-model-selector-content": HTMLElement;
  }
}
