import {
  LAUNCHER_INITIAL_FOCUS,
  type LauncherApi,
  type LauncherOpenChangeReason,
  type LauncherState,
  launcherPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const TRIGGER = `<kind-launcher-trigger><button><span data-launcher-icon></span><kind-launcher-badge></kind-launcher-badge></button></kind-launcher-trigger>`;

const HEADER = `<div data-launcher-header><kind-launcher-title><h2></h2></kind-launcher-title><kind-launcher-close><button></button></kind-launcher-close></div>`;

// Each element's instance, which the content's portal reads to tell how it presents.
const instances = new WeakMap<Element, { get(): unknown }>();
const viewports = new WeakMap<Element, Element>();

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const owns = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const text = (node: Element | null, value: string) => {
  if (owns(node) && node.textContent !== value) node.textContent = value;
};

/**
 * Write the chat inside a `kind-launcher-content`: `<kind-launcher label="Assistant"><kind-launcher-content>…`. The
 * element adds the floating button and the backdrop before it, unless it has a trigger of its own, and the header
 * with the title and Close at the start of the content, unless it has a title.
 */
export function defineLauncher(): void {
  if (customElements.get("kind-launcher")) return;
  createParts(launcherPrimitive, {
    root: {
      tag: "kind-launcher",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      // `open` and `close` are offered only while available, so they aren't copied onto `api`.
      api: ["isOpen", "setOpen", "toggle"],
      // A sheet sits in a full-screen viewport, which the content moves into while it presents as one.
      portal: {
        slots: ["content"],
        container: (el) => {
          if ((instances.get(el)?.get() as LauncherState | undefined)?.presentation !== "sheet") return null;
          let viewport = viewports.get(el);
          if (!viewport) {
            const created = el.ownerDocument.createElement("kind-launcher-viewport");
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
        let content = el.querySelector("kind-launcher-content");
        if (!content) {
          content = el.ownerDocument.createElement("kind-launcher-content");
          el.append(content);
        }
        if (!el.querySelector("kind-launcher-trigger"))
          content.insertAdjacentHTML(
            "beforebegin",
            `${TRIGGER}<kind-launcher-backdrop hidden></kind-launcher-backdrop>`,
          );
        const title = content.querySelector("kind-launcher-title");
        if (!title) content.insertAdjacentHTML("afterbegin", HEADER);
        else if (!title.firstElementChild && !title.textContent?.trim())
          title.replaceChildren(el.ownerDocument.createElement("h2"));
        // As React's `LauncherContent` places it, unless the author wrote their own.
        for (const [name, value] of [
          ["initial-focus", LAUNCHER_INITIAL_FOCUS],
          ["keep-mounted", ""],
          ["side", "top"],
          ["align", "end"],
          ["side-offset", "12"],
        ] as const)
          if (!content.hasAttribute(name)) content.setAttribute(name, value);
        const draw = () => {
          const state = instance.get() as LauncherState;
          text(el.querySelector("kind-launcher-title > h2"), state.label);
          // Empty without unread messages, or the hidden count would still be the button's text.
          text(
            el.querySelector("kind-launcher-badge"),
            state.unread > 99 ? "99+" : state.unread > 0 ? String(state.unread) : "",
          );
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-launcher-trigger", target: wrappedButton, display: "contents" },
    badge: "kind-launcher-badge",
    backdrop: "kind-launcher-backdrop",
    viewport: "kind-launcher-viewport",
    content: "kind-launcher-content",
    title: { tag: "kind-launcher-title", target: wrappedChild("h2"), display: "contents" },
    close: { tag: "kind-launcher-close", target: wrappedButton, display: "contents" },
  });
}

export type KindLauncherEvents = {
  openchange: UiChangeEvent<boolean, LauncherOpenChangeReason>;
};

export interface KindLauncherElement
  extends UiElement<KindLauncherEvents>,
    AttributeProperties<typeof launcherPrimitive, "api" | "open"> {
  open: boolean;
  api: Pick<LauncherApi, "isOpen" | "setOpen" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-launcher": KindLauncherElement;
    "kind-launcher-trigger": HTMLElement;
    "kind-launcher-badge": HTMLElement;
    "kind-launcher-backdrop": HTMLElement;
    "kind-launcher-viewport": HTMLElement;
    "kind-launcher-content": HTMLElement;
    "kind-launcher-title": HTMLElement;
    "kind-launcher-close": HTMLElement;
  }
}
