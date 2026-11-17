import {
  type AddMenuActionReason,
  type AddMenuApi,
  type AddMenuContentState,
  type AddMenuOptions,
  type AddMenuSection,
  type AddMenuState,
  addMenuPrimitive,
} from "@kind-ui/agent-ui/core";
import type { MenuOpenChangeReason } from "@ui-sdk/core/menu";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalMenu } from "./internal/menu.js";

const DEFAULT_PARTS = `<kind-internal-menu><ui-menu><kind-add-menu-trigger><ui-menu-trigger><button type="button" data-agent-hidden><span data-add-menu-icon aria-hidden="true"></span></button></ui-menu-trigger></kind-add-menu-trigger><kind-add-menu-content><ui-menu-content side-offset="6" align="start"></ui-menu-content></kind-add-menu-content></ui-menu></kind-internal-menu>`;

// Contents this element filled in, and so draws the rows of. A content someone wrote keeps its rows, as React's
// children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const drawn = new WeakMap<Element, AddMenuContentState>();

type AddMenuIcon = string | Element;

const element = (document: Document, tag: string, attributes: Record<string, string> = {}, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

/** An icon as nodes: a string is an image URL, an element is copied. */
const iconNodes = (document: Document, icon: unknown): Node[] =>
  typeof icon === "string"
    ? [element(document, "img", { alt: "", src: icon })]
    : icon instanceof Element
      ? [icon.cloneNode(true)]
      : [];

/** A level's rows as elements, built from their data so no label is parsed as markup. */
const rowElements = (document: Document, sections: AddMenuSection[]): Element[] =>
  sections.flatMap((section, index) => {
    const rows = section.rows.map((row) => {
      const text = element(document, "span", { "data-menu-text": "" });
      text.append(element(document, "span", {}, row.label));
      if (row.description)
        text.append(element(document, "span", { "data-menu-description": "" }, row.description));
      const content: Node[] = [];
      if (row.icon !== undefined) {
        const icon = element(document, "ui-menu-item-icon");
        icon.append(...iconNodes(document, row.icon));
        content.push(icon);
      }
      content.push(text);
      if (!row.sections) {
        const item = element(document, "ui-menu-item", { value: row.id, label: row.label });
        item.toggleAttribute("disabled", row.disabled);
        item.append(...content);
        return item;
      }
      const trigger = element(document, "ui-menu-sub-trigger");
      trigger.toggleAttribute("disabled", row.disabled);
      trigger.append(...content, element(document, "span", { "data-menu-chevron": "" }));
      const sub = element(document, "ui-menu-sub-content");
      sub.append(...rowElements(document, row.sections));
      const submenu = element(document, "ui-menu-sub");
      submenu.append(trigger, sub);
      return submenu;
    });
    const separator = index > 0 ? [element(document, "ui-menu-separator")] : [];
    if (section.label === undefined) return [...separator, ...rows];
    const group = element(document, "ui-menu-group");
    group.append(element(document, "ui-menu-group-label", {}, section.label), ...rows);
    return [...separator, group];
  });

/**
 * `<kind-add-menu>` fills in its trigger and menu when it has no children. Set `items` as a property; with `can-run`,
 * choosing an item fires `addaction` with its `id` as `detail.value`.
 */
export function defineAddMenu(): void {
  if (customElements.get("kind-add-menu")) return;
  defineInternalMenu();
  createParts(addMenuPrimitive, {
    root: {
      tag: "kind-add-menu",
      kinds: { canRun: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindAddMenuElement).canRun ? {} : { onAction: undefined }),
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      // The inner menu fires an `action` of its own.
      events: { onAction: "addaction" },
      api: ["isOpen", "setOpen"],
      render: (el, instance) => {
        if (!el.firstElementChild) {
          el.innerHTML = DEFAULT_PARTS;
          const content = el.querySelector("kind-add-menu-content > ui-menu-content");
          if (content) owned.add(content);
        }
        const api = instance.api as AddMenuApi;
        const draw = () => {
          const state = instance.get() as AddMenuState;
          const { controller, presentation, open } = api.partState.menu(state);
          const menu = el.querySelector("ui-menu");
          if (menu) {
            if (menu.controller !== controller) menu.controller = controller;
            if (menu.presentation !== presentation) menu.presentation = presentation;
            if (menu.open !== open) menu.open = open;
          }
          const trigger = el.querySelector("kind-add-menu-trigger > ui-menu-trigger");
          const props = api.partState.trigger(state);
          trigger?.toggleAttribute("disabled", props.disabled);
          const button = trigger?.querySelector("button");
          if (button && button.ariaLabel !== props["aria-label"]) button.ariaLabel = props["aria-label"];
          const content = el.querySelector("kind-add-menu-content > ui-menu-content");
          const rows = api.contentState(state);
          if (content && owned.has(content) && drawn.get(content) !== rows) {
            drawn.set(content, rows);
            content.replaceChildren(...rowElements(el.ownerDocument, rows.sections));
          }
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-add-menu-trigger", display: "contents" },
    content: { tag: "kind-add-menu-content", display: "contents" },
  });
}

export type KindAddMenuEvents = {
  addaction: UiChangeEvent<string, AddMenuActionReason>;
  openchange: UiChangeEvent<boolean, MenuOpenChangeReason>;
};

export interface KindAddMenuElement
  extends UiElement<KindAddMenuEvents>,
    AttributeProperties<typeof addMenuPrimitive, "api" | "items" | "open"> {
  /**
   * An entry's `icon` is an image URL, or an element (such as an `svg`) copied into its row. A copy keeps the
   * element's ids, so pass an icon that uses `defs` (gradients, masks) as an image URL.
   */
  items?: (Omit<NonNullable<AddMenuOptions["items"]>[number], "icon" | "items"> & {
    icon?: AddMenuIcon;
    items?: NonNullable<KindAddMenuElement["items"]>;
  })[];
  open: boolean;
  /** Whether a person can run the items, which fires `addaction`. Without it every item is disabled. */
  canRun: boolean;
  api: Pick<AddMenuApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-add-menu": KindAddMenuElement;
    "kind-add-menu-trigger": HTMLElement;
    "kind-add-menu-content": HTMLElement;
  }
}
