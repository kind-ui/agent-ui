import {
  type AddMenuActionReason,
  type AddMenuApi,
  type AddMenuContentState,
  type AddMenuOptions,
  type AddMenuRow,
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

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// Moves only what is out of place, so a focused row keeps focus. `moveBefore` doesn't reconnect, where the browser
// has it.
const place = (parent: Movable, child: Element, before: Element | null) => {
  if (child.parentElement === parent && child.nextElementSibling === before) return;
  if (parent.moveBefore && child.isConnected && parent.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

// What each row's content was last drawn from, so an update that keeps it leaves its nodes alone.
const drawnRows = new WeakMap<Element, Pick<AddMenuRow, "label" | "description" | "icon">>();

/** A row's icon and text, built from its data so no label is parsed as markup. */
const drawRowContent = (target: Element, row: AddMenuRow, extra: Node[]) => {
  const last = drawnRows.get(target);
  if (last?.label === row.label && last.description === row.description && last.icon === row.icon) return;
  drawnRows.set(target, { label: row.label, description: row.description, icon: row.icon });
  const document = target.ownerDocument;
  const text = element(document, "span", { "data-menu-text": "" });
  text.append(element(document, "span", {}, row.label));
  if (row.description)
    text.append(element(document, "span", { "data-menu-description": "" }, row.description));
  const icon = row.icon === undefined ? [] : [element(document, "ui-menu-item-icon")];
  icon[0]?.append(...iconNodes(document, row.icon));
  target.replaceChildren(...icon, text, ...extra);
};

/**
 * Draws a level's rows into `parent`, reusing each row's element by its `id` and moving only what is out of place, so
 * a person's focus and highlight survive a change of `items` while the menu is open.
 */
const drawLevel = (parent: Element, sections: AddMenuSection[]) => {
  const document = parent.ownerDocument;
  const rows = new Map<string, Element>();
  for (const row of parent.querySelectorAll(":scope > [data-row], :scope > ui-menu-group > [data-row]"))
    rows.set(row.getAttribute("data-row") ?? "", row);
  const groups = new Map<string, Element>();
  for (const group of parent.querySelectorAll(":scope > ui-menu-group"))
    groups.set(group.getAttribute("data-section") ?? "", group);
  const separators = [...parent.querySelectorAll(":scope > ui-menu-separator")];
  const kept = new Set<Element>();
  let previous: Element | null = null;
  const next = (container: Element, after: Element | null) =>
    after ? after.nextElementSibling : container.firstElementChild;

  const drawRow = (row: AddMenuRow) => {
    let el = rows.get(row.id);
    rows.delete(row.id);
    const opens = row.sections !== undefined;
    if (el && (el.localName === "ui-menu-sub") !== opens) {
      el.remove();
      el = undefined;
    }
    if (!opens) {
      el ??= element(document, "ui-menu-item", { "data-row": row.id });
      el.setAttribute("value", row.id);
      el.setAttribute("label", row.label);
      el.toggleAttribute("disabled", row.disabled);
      drawRowContent(el, row, []);
      return el;
    }
    if (!el) {
      el = element(document, "ui-menu-sub", { "data-row": row.id });
      el.append(element(document, "ui-menu-sub-trigger"), element(document, "ui-menu-sub-content"));
    }
    const trigger = el.querySelector(":scope > ui-menu-sub-trigger");
    if (trigger) {
      trigger.toggleAttribute("disabled", row.disabled);
      drawRowContent(trigger, row, [element(document, "span", { "data-menu-chevron": "" })]);
    }
    const sub = el.querySelector(":scope > ui-menu-sub-content");
    if (sub && row.sections) drawLevel(sub, row.sections);
    return el;
  };

  for (const [index, section] of sections.entries()) {
    if (index > 0) {
      const separator = separators.shift() ?? element(document, "ui-menu-separator");
      place(parent, separator, next(parent, previous));
      kept.add(separator);
      previous = separator;
    }
    if (section.label === undefined) {
      for (const row of section.rows) {
        const el = drawRow(row);
        place(parent, el, next(parent, previous));
        kept.add(el);
        previous = el;
      }
      continue;
    }
    let group = groups.get(section.label);
    if (!group) {
      group = element(document, "ui-menu-group", { "data-section": section.label });
      group.append(element(document, "ui-menu-group-label", {}, section.label));
    }
    place(parent, group, next(parent, previous));
    kept.add(group);
    previous = group;
    let last = group.querySelector(":scope > ui-menu-group-label");
    for (const row of section.rows) {
      const el = drawRow(row);
      place(group, el, next(group, last));
      last = el;
    }
  }
  for (const child of [...parent.children]) if (!kept.has(child)) child.remove();
  for (const row of rows.values()) row.remove();
};

/**
 * `<kind-add-menu>` fills in its trigger and menu when it has no children. Set `items` as a property; with `can-run`,
 * choosing an item fires `addaction` with its `id` as `detail.value`. Markup you write puts the `ui-menu` inside a
 * `kind-internal-menu`, which styles it, and an empty `ui-menu-content` in `kind-add-menu-content` gets the rows.
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
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
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
          // A content written empty fills itself in, as React's bare `AddMenuContent` does.
          if (content && !content.firstChild) owned.add(content);
          if (content && owned.has(content) && drawn.get(content) !== rows) {
            drawn.set(content, rows);
            drawLevel(content, rows.sections);
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
