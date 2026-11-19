import {
  type SidebarApi,
  type SidebarOpenChangeReason,
  type SidebarOptions,
  type SidebarState,
  sidebarPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalDrawer } from "./internal/drawer.js";
import { defineInternalResizable } from "./internal/resizable.js";

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };
type Writable = Element & Record<string, unknown>;

// The Resizable or the Drawer each sidebar made, kept across instances, because UI SDK rebuilds one when the
// element returns to the page.
const frames = new WeakMap<Element, { resizable?: Element; drawer?: Element; handle?: Element }>();

// `moveBefore` keeps the panel's focus and state where the browser has it; `insertBefore` reconnects it.
const place = (parent: Movable, child: Element, before: Element | null = null) => {
  if (child === before || (child.parentElement === parent && child.nextElementSibling === before)) return;
  if (parent.moveBefore && child.isConnected && parent.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

const setAttr = (el: Element, name: string, value: string | boolean) => {
  if (value === false) el.removeAttribute(name);
  else if (el.getAttribute(name) !== (value === true ? "" : value))
    el.setAttribute(name, value === true ? "" : value);
};

const write = (target: Element, key: string, value: unknown) => {
  if ((target as Writable)[key] !== value) (target as Writable)[key] = value;
};

const make = (doc: Document, html: string) => {
  const template = doc.createElement("template");
  template.innerHTML = html;
  return template.content.firstElementChild as Element;
};

// The sidebar's own parts: not those of a sidebar nested in its panel or inset.
const owned = (el: Element, tag: string) =>
  [...el.querySelectorAll(tag)].filter((part) => part.parentElement?.closest("kind-sidebar") === el);
const own = (el: Element, tag: string) => owned(el, tag)[0] ?? null;

/**
 * Puts the host's panel and inset inside a Resizable while the panel is beside the page, and the panel inside a
 * Drawer while it's under `overlayBelow`, moving the same elements between the two.
 */
const draw = (el: HTMLElement, api: SidebarApi, state: SidebarState) => {
  const panel = own(el, "kind-sidebar-panel");
  const inset = own(el, "kind-sidebar-inset");
  if (!panel || !inset) return;
  const doc = el.ownerDocument;
  const made = frames.get(el) ?? {};
  frames.set(el, made);
  const panelState = api.panelState(state);

  if (state.overlay) {
    made.drawer ??= make(
      doc,
      `<kind-internal-drawer><ui-drawer><ui-drawer-backdrop hidden></ui-drawer-backdrop><ui-drawer-content hidden keep-mounted></ui-drawer-content></ui-drawer></kind-internal-drawer>`,
    );
    const drawer = made.drawer.querySelector("ui-drawer") as Element;
    const content = made.drawer.querySelector("ui-drawer-content") as Element;
    setAttr(drawer, "side", panelState.drawer.side);
    setAttr(content, "aria-label", panelState.drawerContent["aria-label"]);
    place(el, made.drawer, el.firstElementChild);
    place(content, panel);
    place(el, inset, made.drawer.nextElementSibling);
    made.resizable?.remove();
    made.handle?.remove();
    write(drawer, "open", panelState.drawer.open);
    return;
  }

  const { resizable: props } = api.rootState(state);
  made.resizable ??= make(
    doc,
    `<kind-internal-resizable><ui-resizable><ui-resizable-panel></ui-resizable-panel><ui-resizable-panel></ui-resizable-panel></ui-resizable></kind-internal-resizable>`,
  );
  made.handle ??= make(
    doc,
    `<kind-sidebar-handle><ui-resizable-handle></ui-resizable-handle></kind-sidebar-handle>`,
  );
  const group = made.resizable.querySelector("ui-resizable") as Element;
  const [first, second] = [...group.querySelectorAll(":scope > ui-resizable-panel")] as [Element, Element];
  const [panelFrame, insetFrame] = state.side === "end" ? [second, first] : [first, second];
  const { id, defaultSize, minSize, maxSize, collapsedSize } = panelState.resizablePanel;
  setAttr(panelFrame, "id", id);
  setAttr(panelFrame, "default-size", String(defaultSize));
  setAttr(panelFrame, "min-size", String(minSize));
  setAttr(panelFrame, "max-size", String(maxSize));
  setAttr(panelFrame, "collapsed-size", String(collapsedSize));
  setAttr(panelFrame, "collapsible", true);
  setAttr(panelFrame, "data-sidebar-frame", "panel");
  setAttr(insetFrame, "data-sidebar-frame", "inset");
  for (const name of ["default-size", "min-size", "max-size", "collapsed-size", "collapsible"])
    insetFrame.removeAttribute(name);
  setAttr(insetFrame, "id", api.insetState(state).resizablePanel.id);
  write(group, "controller", props.controller);
  write(group, "storage", props.storage);
  setAttr(group, "auto-save-id", props.autoSaveId ?? false);
  setAttr(
    made.handle.querySelector("ui-resizable-handle") as Element,
    "aria-label",
    api.handleState(state)["aria-label"],
  );
  // The panels and handle take their place before the group connects, so it lays them out once.
  place(group, made.handle, second);
  place(panelFrame, panel);
  place(insetFrame, inset);
  place(el, made.resizable, el.firstElementChild);
  made.drawer?.remove();
};

/**
 * `<kind-sidebar label="Chats">` holds a `kind-sidebar-panel` and a `kind-sidebar-inset`, with a
 * `kind-sidebar-trigger` around a `button` anywhere inside. It puts them in a Resizable, with its resize handle, or
 * the panel in a Drawer under `overlay-below`. Opening and closing fires `openchange`.
 */
export function defineSidebar(): void {
  if (customElements.get("kind-sidebar")) return;
  defineInternalResizable();
  defineInternalDrawer();
  createParts(sidebarPrimitive, {
    root: {
      tag: "kind-sidebar",
      display: "block",
      // Without it, `defaultOpen = false` reads as a missing attribute.
      defaults: { defaultOpen: true },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen"],
      render: (el, instance) => {
        const api = instance.api as SidebarApi;
        const redraw = () => draw(el, api, instance.get() as SidebarState);
        redraw();
        const unsubscribe = instance.subscribe(redraw);
        // A panel or inset written after the sidebar connected.
        const arrivals = new MutationObserver((records) => {
          if (
            records.some((record) =>
              [...record.addedNodes].some(
                (node) => node instanceof Element && /^kind-sidebar-(panel|inset)$/.test(node.localName),
              ),
            )
          )
            redraw();
        });
        arrivals.observe(el, { childList: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    title: { tag: "kind-sidebar-panel", display: "block" },
    handle: { tag: "kind-sidebar-handle", display: "contents" },
    inset: { tag: "kind-sidebar-inset", display: "block" },
    trigger: { tag: "kind-sidebar-trigger", target: wrappedButton, display: "contents" },
  });
}

export type KindSidebarEvents = {
  openchange: UiChangeEvent<boolean, SidebarOpenChangeReason>;
};

export interface KindSidebarElement
  extends UiElement<KindSidebarEvents>,
    AttributeProperties<typeof sidebarPrimitive, "api" | "open" | "storage"> {
  open: boolean;
  storage?: SidebarOptions["storage"];
  api: Pick<SidebarApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-sidebar": KindSidebarElement;
    "kind-sidebar-panel": HTMLElement;
    "kind-sidebar-handle": HTMLElement;
    "kind-sidebar-inset": HTMLElement;
    "kind-sidebar-trigger": HTMLElement;
  }
}
