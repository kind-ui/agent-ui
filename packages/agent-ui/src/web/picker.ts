import {
  type PickerApi,
  type PickerBaseApi,
  type PickerBaseState,
  type PickerCommandState,
  type PickerItemState,
  type PickerOpenChangeReason,
  type PickerOptions,
  type PickerPage,
  type PickerRow,
  type PickerValueChangeReason,
  pickerPrimitive,
} from "@kind-ui/agent-ui/core";
import type { OptionsOf, Primitive } from "@ui-sdk/core";
import { createParts, type PartOptions, type RootOptions, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalCommand } from "./internal/command.js";

const defaultParts = (tag: string) =>
  `<${tag}-trigger><button></button></${tag}-trigger><${tag}-content hidden><${tag}-command><kind-internal-command><ui-command><ui-command-input><input data-agent-hidden></ui-command-input><ui-command-empty></ui-command-empty><ui-command-list></ui-command-list></ui-command></kind-internal-command></${tag}-command><${tag}-note></${tag}-note></${tag}-content>`;

type PickerIcon = string | Element;

// Parts this element filled in, and so writes. A part someone wrote keeps its own, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
// Each element's instance, which the content's portal reads to tell how it presents.
const instances = new WeakMap<Element, { get: () => unknown }>();
// The full-screen element each picker's sheet sits in, made the first time it presents as one.
const viewports = new WeakMap<Element, Element>();
// What each part was last drawn from, so a redraw for another part's change leaves it alone.
const drawn = new WeakMap<Element, unknown>();

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

/** An icon as nodes: a string is an image URL, an element is copied. */
const iconNodes = (document: Document, icon: unknown): Node[] =>
  typeof icon === "string"
    ? [element(document, "img", { alt: "", src: icon })]
    : icon instanceof Element
      ? [icon.cloneNode(true)]
      : [];

/** The trigger's icon, text and chevron, drawn only when they changed. */
const drawTrigger = (button: Element, text: string, icon: unknown) => {
  const document = button.ownerDocument;
  if (!drawn.has(button) || drawn.get(button) !== icon) {
    drawn.set(button, icon);
    button.replaceChildren(
      ...(icon === undefined ? [] : [element(document, "span", { "data-picker-icon": "" })]),
      element(document, "span", { "data-picker-text": "" }),
      element(document, "span", { "data-picker-chevron": "" }),
    );
    button.querySelector("[data-picker-icon]")?.append(...iconNodes(document, icon));
  }
  const label = button.querySelector("[data-picker-text]");
  if (label && label.textContent !== text) label.textContent = text;
};

type IconNodes = (document: Document, row: PickerRow) => Node[];

const rowIcon: IconNodes = (document, row) => iconNodes(document, row.icon);

/** A row's content inside its `kind-picker-item`, built from its data so no label is parsed as markup. */
const drawItem = (
  part: Element,
  state: PickerItemState,
  icon: IconNodes,
  trailing: IconNodes | undefined,
) => {
  if (drawn.get(part) === state) return;
  const previous = drawn.get(part) as PickerItemState | undefined;
  drawn.set(part, state);
  const document = part.ownerDocument;
  const { row } = state;
  if (previous?.row !== row) {
    const text = element(document, "span", { "data-picker-item-text": "" });
    text.append(element(document, "ui-command-item-text", {}, row.label));
    const icons = row.icon === undefined ? [] : icon(document, row);
    const iconEl = icons.length ? element(document, "ui-command-item-icon") : undefined;
    iconEl?.append(...icons);
    part.replaceChildren(
      ...(iconEl ? [iconEl] : []),
      text,
      ...(row.meta
        ? [
            element(
              document,
              "span",
              row.metaLabel ? { "data-picker-meta": "", "aria-hidden": "true" } : { "data-picker-meta": "" },
              row.meta,
            ),
          ]
        : []),
      ...(row.meta && row.metaLabel
        ? [element(document, "span", { "data-picker-meta-label": "" }, row.metaLabel)]
        : []),
      ...(trailing?.(document, row) ?? []),
      element(document, "span", { "data-picker-mark": "" }),
    );
  }
  const text = part.querySelector("[data-picker-item-text]");
  let description = text?.querySelector("[data-picker-description]");
  if (!state.description.length) description?.remove();
  else {
    if (!description) {
      description = element(document, "span", { "data-picker-description": "" });
      text?.append(description);
    }
    description.replaceChildren(
      ...state.description.map((segment) =>
        segment.match ? element(document, "mark", {}, segment.text) : segment.text,
      ),
    );
  }
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// Moves only what is out of place, so Command keeps the highlight on an item that stays. `moveBefore` doesn't
// reconnect, where the browser has it.
const place = (parent: Movable, child: Element, before: Element | null) => {
  if (child.parentElement === parent && child.nextElementSibling === before) return;
  if (parent.moveBefore && child.isConnected && parent.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

type CommandItemElement = HTMLElement & { keywords: string[] | undefined };

const drawRow = (document: Document, items: Map<string, Element>, row: PickerRow, itemTag: string) => {
  const { value, label, keywords, disabled, page } = row.option;
  let item = items.get(value) as CommandItemElement | undefined;
  items.delete(value);
  if (!item) {
    item = element(document, "ui-command-item", { value }) as CommandItemElement;
    const part = element(document, itemTag, { value });
    owned.add(part);
    item.append(part);
  }
  if (item.getAttribute("label") !== label) item.setAttribute("label", label);
  item.toggleAttribute("disabled", disabled);
  if (page) item.setAttribute("page", page);
  else item.removeAttribute("page");
  write(item, "keywords", keywords);
  write(item, "ariaChecked", row.option["aria-checked"] ?? null);
  return item;
};

/** Draws every page, group and row into the list, reusing their elements. */
const drawList = (list: Element, pages: PickerPage[], itemTag: string) => {
  const document = list.ownerDocument;
  const pageEls = new Map<string, Element>();
  for (const page of list.querySelectorAll(":scope > ui-command-page"))
    pageEls.set(page.getAttribute("value") ?? "", page);
  const items = new Map<string, Element>();
  for (const item of list.querySelectorAll("ui-command-item"))
    items.set(item.getAttribute("value") ?? "", item);
  let previousPage: Element | null = null;
  for (const { page, sections } of pages) {
    let pageEl = pageEls.get(page ?? "");
    pageEls.delete(page ?? "");
    if (!pageEl) pageEl = element(document, "ui-command-page", page ? { value: page } : {});
    // Placed before its rows move in, since `moveBefore` refuses a parent that isn't in the page.
    place(list, pageEl, previousPage ? previousPage.nextElementSibling : list.firstElementChild);
    const kept = new Set<Element>();
    let previous: Element | null = null;
    for (const [index, section] of sections.entries()) {
      if (section.footer && index > 0) {
        let separator = pageEl.querySelector(":scope > ui-command-separator");
        separator ??= element(document, "ui-command-separator");
        place(pageEl, separator, previous ? previous.nextElementSibling : pageEl.firstElementChild);
        kept.add(separator);
        previous = separator;
      }
      const key = section.footer ? "\u0000footer" : (section.label ?? "");
      let group = [...pageEl.querySelectorAll(":scope > ui-command-group")].find(
        (el) => el.getAttribute("data-section") === key,
      );
      if (!group) {
        group = element(document, "ui-command-group", { "data-section": key });
        if (section.label) group.append(element(document, "ui-command-group-label", {}, section.label));
      }
      place(pageEl, group, previous ? previous.nextElementSibling : pageEl.firstElementChild);
      let last = group.querySelector(":scope > ui-command-group-label");
      for (const row of section.rows) {
        const item = drawRow(document, items, row, itemTag);
        place(group, item, last ? last.nextElementSibling : group.firstElementChild);
        last = item;
      }
      kept.add(group);
      previous = group;
    }
    for (const child of [...pageEl.children]) if (!kept.has(child)) child.remove();
    previousPage = pageEl;
  }
  for (const item of items.values()) item.remove();
  for (const page of pageEls.values()) page.remove();
};

/** How a component that spreads `pickerBase` differs from Picker on Web Components. */
export type PickerElementsConfig<P extends Primitive> = {
  /** The parts an empty root fills itself with: Picker's trigger and popover by default. */
  template?: string;
  /** Each `can-<action>` attribute's property, and the callback it offers: `canRun` offers `onAction` by default. */
  can?: Record<string, string>;
  /** The root's live properties: `open` and `value` by default. */
  state?: RootOptions<P>["state"];
  /** The api methods copied onto the element: `isOpen`, `setOpen` and `getValue` by default. */
  api?: RootOptions<P>["api"];
  /** Draws the trigger's content into the button it filled in: Picker's icon, text and chevron by default. */
  drawTrigger?: (button: Element, state: PickerBaseState, api: PickerBaseApi) => void;
  /** A row's icon: an image URL or a copied element by default. None draws no icon. */
  icon?: IconNodes;
  /** What follows a row's `meta`. */
  trailing?: IconNodes;
  /** More parts, as `createParts` takes them. */
  parts?: Record<string, string | PartOptions<P>>;
};

const pickerTrigger = (button: Element, state: PickerBaseState, api: PickerBaseApi) => {
  const { text, icon } = api.triggerState(state);
  drawTrigger(button, text, icon);
};

/**
 * The `createParts` map of a picker whose root is `tag` and whose parts are `<tag>-trigger`, `<tag>-content` and so
 * on: Picker's, or that of a component that spreads `pickerBase`, like Model Selector, which renames the change and
 * action events. The root fills in its trigger and list when it has no children.
 */
export function pickerElements<P extends Primitive>(
  tag: string,
  events: Record<string, string>,
  config: PickerElementsConfig<P> = {},
): { root: RootOptions<P> } & Record<
  "trigger" | "content" | "viewport" | "command" | "item" | "note",
  string | PartOptions<P>
> {
  const can = config.can ?? { canRun: "onAction" };
  const icon = config.icon ?? rowIcon;
  const drawTriggerOf = config.drawTrigger ?? pickerTrigger;
  return {
    ...config.parts,
    root: {
      tag,
      kinds: Object.fromEntries(Object.keys(can).map((key) => [key, "boolean"])),
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) =>
        Object.fromEntries(
          Object.entries(can)
            .filter(([key]) => !(el as unknown as Record<string, unknown>)[key])
            .map(([, callback]) => [callback, undefined]),
        ) as Partial<OptionsOf<P>>,
      state: config.state ?? {
        open: {
          get: (api) => (api as PickerBaseApi).isOpen(),
          set: (api, open) => (api as PickerBaseApi).setOpen(!!open),
        },
        value: {
          get: (api) => (api as PickerBaseApi).getValue(),
          set: (api, value) => (api as PickerBaseApi).setValue?.(String(value)),
        },
      },
      // The inner Command fires `valuechange` and `action` of its own, and its items a `select`.
      events,
      // `setValue` is offered only while enabled, so it isn't copied onto `api`.
      api: config.api ?? (["isOpen", "setOpen", "getValue"] as RootOptions<P>["api"]),
      // A sheet sits in a full-screen viewport, which the content moves into while it presents as one.
      portal: {
        slots: ["content"],
        container: (el) => {
          if ((instances.get(el)?.get() as PickerBaseState | undefined)?.presentation !== "sheet")
            return null;
          let viewport = viewports.get(el);
          if (!viewport) {
            const created = el.ownerDocument.createElement(`${tag}-viewport`);
            // It leaves once the content has moved back in place.
            new MutationObserver(() => created.hasChildNodes() || created.remove()).observe(created, {
              childList: true,
            });
            viewports.set(el, created);
            viewport = created;
          }
          if (viewport.parentNode !== el) el.append(viewport);
          return viewport;
        },
      },
      render: (el, instance) => {
        instances.set(el, instance);
        if (!el.firstElementChild) {
          el.innerHTML = config.template ?? defaultParts(tag);
          for (const part of el.querySelectorAll(`${tag}-trigger > button, ${tag}-command`)) owned.add(part);
          const content = el.querySelector(`${tag}-content`);
          // Focus moves to the search field as the list opens.
          content?.setAttribute("initial-focus", "input");
          content?.setAttribute("side-offset", "6");
          content?.setAttribute("align", "start");
        }
        const api = instance.api as PickerBaseApi;
        const draw = () => {
          const state = instance.get() as PickerBaseState;
          const button = el.querySelector(`${tag}-trigger > button`);
          if (button && owned.has(button)) drawTriggerOf(button, state, api);
          const command = el.querySelector(`${tag}-command`);
          const commandState: PickerCommandState = api.commandState(state);
          if (command && owned.has(command) && drawn.get(command) !== commandState) {
            drawn.set(command, commandState);
            const root = command.querySelector<Element & Record<string, unknown>>("ui-command");
            if (root) for (const [key, value] of Object.entries(commandState.props)) write(root, key, value);
            const input = command.querySelector<HTMLInputElement>("ui-command-input > input");
            write(input, "ariaLabel", commandState.label);
            write(input, "placeholder", commandState.placeholder);
            let status = command.querySelector("ui-command-status");
            if (commandState.statusText === undefined) status?.remove();
            else {
              if (!status) {
                status = el.ownerDocument.createElement("ui-command-status");
                command.querySelector("ui-command-input")?.after(status);
              }
              if (status.textContent !== commandState.statusText)
                status.textContent = commandState.statusText;
            }
            const empty = command.querySelector("ui-command-empty");
            if (empty && empty.textContent !== commandState.emptyText)
              empty.textContent = commandState.emptyText;
            const list = command.querySelector("ui-command-list");
            if (list) drawList(list, commandState.pages, `${tag}-item`);
          }
          const note = el.querySelector(`${tag}-note`);
          if (note && (owned.has(note) || !note.firstChild)) {
            owned.add(note);
            if (note.textContent !== state.note) note.textContent = state.note;
          }
          for (const part of el.querySelectorAll(`${tag}-command ${tag}-item`)) {
            // An item written empty fills itself in, as React's bare `PickerItem` does.
            if (!owned.has(part) && part.firstChild) continue;
            owned.add(part);
            const item = api.itemState(state, part.getAttribute("value") ?? "");
            if (item) drawItem(part, item, icon, config.trailing);
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        return unsubscribe;
      },
    },
    trigger: { tag: `${tag}-trigger`, target: wrappedButton, display: "contents" },
    content: `${tag}-content`,
    viewport: `${tag}-viewport`,
    command: { tag: `${tag}-command`, display: "contents" },
    item: `${tag}-item`,
    note: `${tag}-note`,
  };
}

/**
 * `<kind-picker label="Work in">` fills in its trigger and list when it has no children. Set `items`, `actions` and
 * `value` as properties; choosing an item fires `pickerchange` with its `value` as `detail.value`, and with `can-run`,
 * an action fires `pickeraction` with its `id`.
 */
export function definePicker(): void {
  if (customElements.get("kind-picker")) return;
  defineInternalCommand();
  createParts(
    pickerPrimitive,
    pickerElements<typeof pickerPrimitive>("kind-picker", {
      onValueChange: "pickerchange",
      onAction: "pickeraction",
    }),
  );
}

export type KindPickerEvents = {
  pickerchange: UiChangeEvent<string, PickerValueChangeReason>;
  pickeraction: UiChangeEvent<string, PickerValueChangeReason>;
  openchange: UiChangeEvent<boolean, PickerOpenChangeReason>;
};

type Item = Omit<NonNullable<PickerOptions["items"]>[number], "icon" | "items"> & {
  icon?: PickerIcon;
  items?: Item[];
};

export interface KindPickerElement
  extends UiElement<KindPickerEvents>,
    AttributeProperties<
      typeof pickerPrimitive,
      "api" | "items" | "actions" | "value" | "defaultValue" | "open"
    > {
  /**
   * An item's `icon` is an image URL, or an element (such as an `svg`) copied into its row and the trigger. A copy
   * keeps the element's ids, so pass an icon that uses `defs` (gradients, masks) as an image URL.
   */
  items?: Item[];
  actions?: (Omit<NonNullable<PickerOptions["actions"]>[number], "icon"> & { icon?: PickerIcon })[];
  get value(): string | null;
  set value(value: string);
  defaultValue?: string | null;
  open: boolean;
  /** Whether a person can run the `actions`, which fires `pickeraction`. */
  canRun: boolean;
  api: Pick<PickerApi, "isOpen" | "setOpen" | "getValue">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-picker": KindPickerElement;
    "kind-picker-trigger": HTMLElement;
    "kind-picker-content": HTMLElement;
    "kind-picker-viewport": HTMLElement;
    "kind-picker-command": HTMLElement;
    "kind-picker-item": HTMLElement;
    "kind-picker-note": HTMLElement;
  }
}
