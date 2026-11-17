import {
  type SettingsMenuApi,
  type SettingsMenuChangeReason,
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
const drawnChoices = new WeakMap<Element, SettingsMenuRow & { type: "choice" }>();

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

const drawChoice = (
  document: Document,
  el: Element | undefined,
  row: SettingsMenuRow & { type: "choice" },
) => {
  let sub = el;
  if (!sub) {
    sub = element(document, "ui-menu-sub", { "data-row": row.id });
    const content = element(document, "ui-menu-sub-content");
    content.append(element(document, "ui-menu-radio-group", { name: row.id }));
    sub.append(element(document, "ui-menu-sub-trigger"), content);
  }
  const trigger = sub.querySelector(":scope > ui-menu-sub-trigger");
  const group = sub.querySelector<Selectable>(":scope > ui-menu-sub-content > ui-menu-radio-group");
  if (!trigger || !group) return sub;
  const value =
    trigger.querySelector(":scope > [data-settings-menu-value]") ??
    element(document, "span", { "data-settings-menu-value": "" });
  const chevron =
    trigger.querySelector(":scope > [data-menu-chevron]") ??
    element(document, "span", { "data-menu-chevron": "" });
  drawMenuItemContent(trigger, row, [value, chevron]);
  const last = drawnChoices.get(sub);
  if (last?.options !== row.options) {
    value.replaceChildren(...row.options.map((option) => element(document, "span", {}, option.label)));
    group.replaceChildren(
      ...row.options.map((option) => {
        const item = element(document, "ui-menu-radio-item", { value: option.value, label: option.label });
        const indicator = element(document, "ui-menu-item-indicator", { "keep-mounted": "" });
        indicator.append(element(document, "span", { "data-menu-check": "", "aria-hidden": "true" }));
        item.append(indicator, element(document, "span", {}, option.label));
        return item;
      }),
    );
  }
  drawnChoices.set(sub, row);
  for (const [index, label] of [...value.children].entries())
    label.toggleAttribute("data-current", row.options[index]?.value === row.value);
  if (group.value !== (row.value ?? null)) group.value = row.value ?? null;
  return sub;
};

/**
 * Draws the rows into `parent`, reusing each row's element by its `id` and moving only what is out of place, so a
 * person's focus and highlight survive a change of `settings` or `values` while the menu is open.
 */
const drawRows = (parent: Element, rows: SettingsMenuRow[]) => {
  const document = parent.ownerDocument;
  const existing = new Map<string, Element>();
  for (const row of parent.querySelectorAll(":scope > [data-row]"))
    existing.set(row.getAttribute("data-row") ?? "", row);
  let previous: Element | null = null;
  for (const row of rows) {
    let el = existing.get(row.id);
    existing.delete(row.id);
    const tag = row.type === "toggle" ? "ui-menu-checkbox-item" : "ui-menu-sub";
    if (el && el.localName !== tag) {
      el.remove();
      el = undefined;
    }
    el = row.type === "toggle" ? drawToggle(document, el, row) : drawChoice(document, el, row);
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
          const content = el.querySelector("kind-settings-menu-content > ui-menu-content");
          const rows = api.contentState(state);
          // A content written empty fills itself in, as React's bare `SettingsMenuContent` does.
          if (content && !content.firstChild) owned.add(content);
          if (content && owned.has(content) && drawn.get(content) !== rows) {
            drawn.set(content, rows);
            drawRows(content, rows.rows);
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
