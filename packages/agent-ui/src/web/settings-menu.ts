import {
  type SettingsMenuApi,
  type SettingsMenuChangeReason,
  type SettingsMenuChoiceRow,
  type SettingsMenuContentState,
  type SettingsMenuOptions,
  type SettingsMenuRow,
  type SettingsMenuState,
  settingsMenuPrimitive,
} from "@kind-ui/agent-ui/core";
import type { MenuOpenChangeReason } from "@ui-sdk/core/menu";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import {
  defineInternalMenu,
  drawMenuItemContent,
  menuElement as element,
  placeMenuChild as place,
} from "./internal/menu.js";

const DEFAULT_PARTS = `<kind-internal-menu><ui-menu><kind-settings-menu-trigger><ui-menu-trigger><button type="button" data-agent-hidden><span data-menu-trigger-icon aria-hidden="true"></span></button></ui-menu-trigger></kind-settings-menu-trigger><kind-settings-menu-content><ui-menu-content side-offset="6" align="start"></ui-menu-content></kind-settings-menu-content></ui-menu></kind-internal-menu>`;

// Contents this element filled in, and so draws the rows of. A content someone wrote keeps its rows, as React's
// children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const drawn = new WeakMap<Element, SettingsMenuContentState>();
const drawnRows = new WeakMap<Element, SettingsMenuChoiceRow>();

type Checkable = HTMLElement & { checked: boolean };
type Selectable = HTMLElement & { value: string | null };

const drawToggle = (
  document: Document,
  el: Element | undefined,
  row: SettingsMenuRow & { type: "toggle" },
) => {
  const item = (el ?? element(document, "ui-menu-checkbox-item", { "data-row": row.id })) as Checkable;
  item.setAttribute("value", row.id);
  item.setAttribute("label", row.label);
  let indicator = item.querySelector(":scope > [data-menu-switch]");
  if (!indicator) {
    indicator = element(document, "ui-menu-item-indicator", {
      "keep-mounted": "",
      "data-menu-switch": "",
      "aria-hidden": "true",
    });
    indicator.append(element(document, "span", { "data-menu-switch-thumb": "" }));
  }
  drawMenuItemContent(item, row, [indicator]);
  if (item.checked !== row.checked) item.checked = row.checked;
  return item;
};

/** The value's labels, one per option, reused by `value` so the row keeps its width as the value changes. */
const drawLabels = (document: Document, value: Element, options: SettingsMenuChoiceRow["options"]) => {
  const labels = new Map([...value.children].map((el) => [el.getAttribute("data-value"), el]));
  let previous: Element | null = null;
  for (const option of options) {
    const label = labels.get(option.value) ?? element(document, "span", { "data-value": option.value });
    labels.delete(option.value);
    if (label.textContent !== option.label) label.textContent = option.label;
    place(value, label, previous ? previous.nextElementSibling : value.firstElementChild);
    previous = label;
  }
  for (const el of labels.values()) el.remove();
};

/**
 * A choice's radio group, holding a labelled group per option `group`, then the actions, behind a separator unless
 * the row is `inline`. Radio items and actions are reused by `value`, so a focused one keeps focus.
 */
const drawChoices = (document: Document, content: Element, row: SettingsMenuChoiceRow) => {
  const items = new Map<string, Element>();
  for (const item of content.querySelectorAll("ui-menu-radio-item, :scope > ui-menu-item"))
    items.set(item.getAttribute("value") ?? "", item);
  let radios = content.querySelector<Selectable>(":scope > ui-menu-radio-group");
  if (!radios) {
    radios = element(document, "ui-menu-radio-group", { name: row.id }) as Selectable;
    content.prepend(radios);
  }
  const groups = new Map<string, Element>();
  for (const group of radios.querySelectorAll(":scope > ui-menu-group"))
    groups.set(group.getAttribute("data-group") ?? "", group);
  let previous: Element | null = null;
  const next = (parent: Element, child: Element, after: Element | null) => {
    place(parent, child, after ? after.nextElementSibling : parent.firstElementChild);
    return child;
  };
  for (const { label, options } of row.groups) {
    let parent: Element = radios;
    if (label !== undefined) {
      let group = groups.get(label);
      groups.delete(label);
      if (!group) {
        group = element(document, "ui-menu-group", { "data-group": label });
        group.append(element(document, "ui-menu-group-label", {}, label));
      }
      previous = next(radios, group, previous);
      parent = group;
    }
    let last: Element | null = parent === radios ? previous : parent.firstElementChild;
    for (const option of options) {
      let item = items.get(option.value);
      items.delete(option.value);
      item ??= element(document, "ui-menu-radio-item", { value: option.value });
      let indicator = item.querySelector(":scope > ui-menu-item-indicator");
      if (!indicator) {
        indicator = element(document, "ui-menu-item-indicator", { "keep-mounted": "" });
        indicator.append(element(document, "span", { "data-menu-check": "", "aria-hidden": "true" }));
      }
      item.setAttribute("label", option.label);
      item.toggleAttribute("disabled", option.disabled ?? false);
      drawMenuItemContent(item, option, [indicator]);
      // The check comes first, as React's radio item draws it.
      if (item.firstElementChild !== indicator) item.prepend(indicator);
      last = next(parent, item, last);
    }
    if (parent === radios) previous = last;
  }
  if (radios.value !== (row.value ?? null)) radios.value = row.value ?? null;
  let after: Element | null = radios;
  let separator = content.querySelector(":scope > ui-menu-separator:not([data-section-end])");
  if (row.actions.length && !row.inline) {
    separator ??= element(document, "ui-menu-separator");
    after = next(content, separator, after);
  } else separator?.remove();
  for (const action of row.actions) {
    let item = items.get(action.value);
    items.delete(action.value);
    item ??= element(document, "ui-menu-item", { value: action.value });
    item.setAttribute("label", action.label);
    item.toggleAttribute("data-menu-inset", row.inline);
    drawMenuItemContent(item, action);
    after = next(content, item, after);
  }
  for (const el of [...items.values(), ...groups.values()]) el.remove();
};

const drawChoice = (
  document: Document,
  el: Element | undefined,
  row: SettingsMenuRow & { type: "choice" },
) => {
  let sub = el;
  if (!sub) {
    sub = element(document, "ui-menu-sub", { "data-row": row.id });
    sub.append(element(document, "ui-menu-sub-trigger"), element(document, "ui-menu-sub-content"));
  }
  const trigger = sub.querySelector(":scope > ui-menu-sub-trigger");
  const content = sub.querySelector(":scope > ui-menu-sub-content");
  if (!trigger || !content) return sub;
  const value =
    trigger.querySelector(":scope > [data-settings-menu-value]") ??
    element(document, "span", { "data-settings-menu-value": "" });
  const chevron =
    trigger.querySelector(":scope > [data-menu-chevron]") ??
    element(document, "span", { "data-menu-chevron": "" });
  drawMenuItemContent(trigger, row, [value, chevron]);
  if (drawnRows.get(sub) !== row) {
    drawnRows.set(sub, row);
    drawLabels(document, value, row.options);
    drawChoices(document, content, row);
  }
  for (const [index, label] of [...value.children].entries())
    label.toggleAttribute("data-current", row.options[index]?.value === row.value);
  return sub;
};

/** An inline choice: its options in the menu itself, and a separator after them unless it's the last row. */
const drawSection = (
  document: Document,
  el: Element | undefined,
  row: SettingsMenuChoiceRow,
  last: boolean,
) => {
  const section = el ?? element(document, "div", { "data-row": row.id, "data-settings-menu-section": "" });
  if (drawnRows.get(section) !== row) {
    drawnRows.set(section, row);
    drawChoices(document, section, row);
  }
  let end = section.querySelector(":scope > ui-menu-separator[data-section-end]");
  if (last) end?.remove();
  else if (!end || end !== section.lastElementChild) {
    end ??= element(document, "ui-menu-separator", { "data-section-end": "" });
    section.append(end);
  }
  return section;
};

/**
 * Draws the rows into `parent`, reusing each row's element by its `id` and moving only what is out of place, so a
 * person's focus and highlight survive a change of `settings` or `values` while the menu is open. Model Control draws
 * its rows with it too.
 */
export const drawSettingsRows = (parent: Element, rows: SettingsMenuRow[]) => {
  const document = parent.ownerDocument;
  const existing = new Map<string, Element>();
  for (const row of parent.querySelectorAll(":scope > [data-row]"))
    existing.set(row.getAttribute("data-row") ?? "", row);
  let previous: Element | null = null;
  for (const [index, row] of rows.entries()) {
    let el = existing.get(row.id);
    existing.delete(row.id);
    const tag = row.type === "toggle" ? "ui-menu-checkbox-item" : row.inline ? "div" : "ui-menu-sub";
    if (el && el.localName !== tag) {
      el.remove();
      el = undefined;
    }
    el =
      row.type === "toggle"
        ? drawToggle(document, el, row)
        : row.inline
          ? drawSection(document, el, row, index === rows.length - 1)
          : drawChoice(document, el, row);
    place(parent, el, previous ? previous.nextElementSibling : parent.firstElementChild);
    previous = el;
  }
  for (const row of existing.values()) row.remove();
};

/**
 * `<kind-settings-menu>` fills in its trigger and menu when it has no children. Set `settings` and `values` as
 * properties; a change fires `valueschange` with every value as `detail.value` and the setting in `detail.id`. Markup
 * you write puts the `ui-menu` inside a `kind-internal-menu`, which styles it, and an empty `ui-menu-content` in
 * `kind-settings-menu-content` gets the rows.
 */
export function defineSettingsMenu(): void {
  if (customElements.get("kind-settings-menu")) return;
  defineInternalMenu();
  createParts(settingsMenuPrimitive, {
    root: {
      tag: "kind-settings-menu",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
        values: {
          get: (api) => api.getValues(),
          set: (api, values) => api.setValues((values ?? {}) as Record<string, boolean | string>),
        },
      },
      api: ["isOpen", "setOpen", "getValues", "setValues"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as SettingsMenuApi;
        const draw = () => {
          const state = instance.get() as SettingsMenuState;
          const { controller, presentation, open } = api.partState.menu(state);
          const menu = el.querySelector("ui-menu");
          if (menu) {
            if (menu.controller !== controller) menu.controller = controller;
            if (menu.presentation !== presentation) menu.presentation = presentation;
            if (menu.open !== open) menu.open = open;
          }
          const trigger = el.querySelector("kind-settings-menu-trigger > ui-menu-trigger");
          const props = api.partState.trigger(state);
          trigger?.toggleAttribute("disabled", props.disabled);
          const button = trigger?.querySelector("button");
          if (button && button.ariaLabel !== props["aria-label"]) button.ariaLabel = props["aria-label"];
          button?.toggleAttribute("data-kind-trigger", props["data-kind-trigger"] === "");
          button?.toggleAttribute("data-kind-icon-button", props["data-kind-icon-button"] === "");
          const content = el.querySelector("kind-settings-menu-content > ui-menu-content");
          const rows = api.contentState(state);
          // A content written empty fills itself in, as React's bare `SettingsMenuContent` does.
          if (content && !content.firstChild) owned.add(content);
          if (content && owned.has(content) && drawn.get(content) !== rows) {
            drawn.set(content, rows);
            drawSettingsRows(content, rows.rows);
          }
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-settings-menu-trigger", display: "contents" },
    content: { tag: "kind-settings-menu-content", display: "contents" },
  });
}

export type KindSettingsMenuEvents = {
  valueschange: UiChangeEvent<Record<string, boolean | string>, SettingsMenuChangeReason> & {
    detail: { id: string };
  };
  openchange: UiChangeEvent<boolean, MenuOpenChangeReason>;
};

export interface KindSettingsMenuElement
  extends UiElement<KindSettingsMenuEvents>,
    AttributeProperties<typeof settingsMenuPrimitive, "api" | "settings" | "values" | "open"> {
  /**
   * A setting's `icon` is an image URL, or an element (such as an `svg`) copied into its row. A copy keeps the
   * element's ids, so pass an icon that uses `defs` (gradients, masks) as an image URL.
   */
  settings?: (NonNullable<SettingsMenuOptions["settings"]>[number] & { icon?: string | Element })[];
  /** The values by setting `id`. Setting it changes each value that differs, firing `valueschange` for each. */
  values: Record<string, boolean | string>;
  open: boolean;
  api: Pick<SettingsMenuApi, "isOpen" | "setOpen" | "getValues" | "setValues">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-settings-menu": KindSettingsMenuElement;
    "kind-settings-menu-trigger": HTMLElement;
    "kind-settings-menu-content": HTMLElement;
  }
}
