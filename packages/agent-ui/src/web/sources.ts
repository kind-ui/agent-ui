import "@ui-sdk/web/avatar";
import {
  type SourcesApi,
  type SourcesOpenChangeReason,
  type SourcesOptions,
  type SourcesState,
  sourcesPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

const DEFAULT_PARTS = `<kind-sources-trigger><button></button></kind-sources-trigger><kind-sources-content><kind-sources-list></kind-sources-list></kind-sources-content>`;
const ITEM_PARTS = `<kind-sources-link><a><kind-sources-icon></kind-sources-icon><kind-sources-title></kind-sources-title><kind-sources-host></kind-sources-host></a></kind-sources-link><kind-sources-snippet></kind-sources-snippet>`;

// Parts this element wrote into, and items it added. A part someone wrote into keeps it, and an item someone wrote
// stays, as React's children do. Kept across instances, because UI SDK rebuilds one when the element returns to
// the page.
const owned = new WeakSet<Element>();

const claim = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

/** Fills an empty icon part with a UI SDK Avatar, and keeps the one it wrote current. */
const drawIcon = (part: Element | null, { favicon, initial }: SourcesState["entries"][string]) => {
  if (!claim(part)) return;
  let avatar = part.querySelector("ui-avatar");
  if (!avatar) {
    avatar = part.ownerDocument.createElement("ui-avatar");
    avatar.append(part.ownerDocument.createElement("ui-avatar-fallback"));
    part.replaceChildren(avatar);
  }
  let image = avatar.querySelector(":scope > img");
  if (favicon) {
    if (!image) {
      image = part.ownerDocument.createElement("img");
      image.setAttribute("alt", "");
      avatar.prepend(image);
    }
    if (image.getAttribute("src") !== favicon) image.setAttribute("src", favicon);
  } else image?.remove();
  fill(avatar.querySelector("ui-avatar-fallback"), initial);
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused link focused where the browser has it; `insertBefore` blurs it.
function move(list: Movable, item: Element, before: Element | null): void {
  if (list.moveBefore && item.isConnected) list.moveBefore(item, before);
  else list.insertBefore(item, before);
}

/**
 * Adds an item for each source the list lacks, in order, removes the items it added for sources that left or that
 * a written item replaced, and fills in every item's parts.
 */
const drawItems = (list: Movable, { sources, entries }: SourcesState) => {
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
  const ids = new Set<string | null>(sources.map((source) => source.id));
  for (const [id, child] of children) if (owned.has(child) && !ids.has(id)) child.remove();
  let previous: Element | null = null;
  for (const { id } of sources) {
    const entry = entries[id];
    if (!entry) continue;
    let child = children.get(id);
    if (!child) {
      child = list.ownerDocument.createElement("kind-sources-item");
      child.setAttribute("value", id);
      owned.add(child);
    }
    const before: Element | null = previous ? previous.nextElementSibling : list.firstElementChild;
    if (owned.has(child) && before !== child) move(list, child, before);
    previous = child;
    if (!child.firstElementChild) child.innerHTML = ITEM_PARTS;
    drawIcon(child.querySelector("kind-sources-icon"), entry);
    fill(child.querySelector("kind-sources-title"), entry.title);
    fill(child.querySelector("kind-sources-host"), entry.host);
    fill(child.querySelector("kind-sources-snippet"), entry.snippet);
  }
};

/**
 * `<kind-sources>` fills in its trigger and content when it has no children. Set `sources` as a property: its list
 * gets a `kind-sources-item` for each source it lacks, in order, and every item's empty parts get a link to the
 * source with its icon, title and host name, then its snippet. Write a `<kind-sources-item value="…">` to render a
 * source yourself.
 */
export function defineSources(): void {
  if (customElements.get("kind-sources")) return;
  createParts(sourcesPrimitive, {
    root: {
      tag: "kind-sources",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "toggle"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as SourcesState;
          fill(el.querySelector("kind-sources-trigger > button"), state.label);
          const list = el.querySelector("kind-sources-list");
          if (list) drawItems(list, state);
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
    trigger: { tag: "kind-sources-trigger", target: wrappedButton, display: "contents" },
    content: "kind-sources-content",
    list: "kind-sources-list",
    item: "kind-sources-item",
    link: { tag: "kind-sources-link", target: wrappedChild("a"), display: "contents" },
    icon: "kind-sources-icon",
    title: "kind-sources-title",
    host: "kind-sources-host",
    snippet: "kind-sources-snippet",
  });
}

export type KindSourcesEvents = {
  openchange: UiChangeEvent<boolean, SourcesOpenChangeReason>;
};

export interface KindSourcesElement
  extends UiElement<KindSourcesEvents>,
    AttributeProperties<typeof sourcesPrimitive, "api" | "open" | "sources"> {
  open: boolean;
  sources?: SourcesOptions["sources"];
  api: Pick<SourcesApi, "isOpen" | "setOpen" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-sources": KindSourcesElement;
    "kind-sources-trigger": HTMLElement;
    "kind-sources-content": HTMLElement;
    "kind-sources-list": HTMLElement;
    "kind-sources-item": UiPartElement<typeof sourcesPrimitive, "item", "value">;
    "kind-sources-link": HTMLElement;
    "kind-sources-icon": HTMLElement;
    "kind-sources-title": HTMLElement;
    "kind-sources-host": HTMLElement;
    "kind-sources-snippet": HTMLElement;
  }
}
