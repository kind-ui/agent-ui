import {
  type InlineCitationApi,
  type InlineCitationOpenChangeReason,
  type InlineCitationOptions,
  type InlineCitationState,
  inlineCitationPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { CarouselController } from "@ui-sdk/web/carousel";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";
import "@ui-sdk/web/carousel";

// Lucide "chevron-left" and "chevron-right", see THIRD_PARTY_NOTICES.md.
const chevron = (path: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${path}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DEFAULT_PARTS = `<kind-inline-citation-trigger><button></button></kind-inline-citation-trigger><kind-inline-citation-content hidden></kind-inline-citation-content>`;
// Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent pages with the
// citation's own `next` and `previous`.
const CAROUSEL_PARTS = `<ui-carousel aria-label="Sources" drag="false"><ui-carousel-viewport><ui-carousel-content></ui-carousel-content></ui-carousel-viewport><span data-inline-citation-controls><ui-carousel-previous><button aria-label="Previous source" data-agent-hidden>${chevron("m15 18-6-6 6-6")}</button></ui-carousel-previous><kind-inline-citation-index></kind-inline-citation-index><ui-carousel-next><button aria-label="Next source" data-agent-hidden>${chevron("m9 18 6-6-6-6")}</button></ui-carousel-next></span></ui-carousel>`;
const ITEM_PARTS = `<kind-inline-citation-link><a><kind-inline-citation-host></kind-inline-citation-host><kind-inline-citation-source-title></kind-inline-citation-source-title></a></kind-inline-citation-link><kind-inline-citation-snippet></kind-inline-citation-snippet>`;

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const claim = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused link focused where the browser has it; `insertBefore` blurs it.
function move(row: Movable, slide: Element, before: Element | null): void {
  if (row.moveBefore && slide.isConnected) row.moveBefore(slide, before);
  else row.insertBefore(slide, before);
}

const createItem = (doc: Document, id: string) => {
  const item = doc.createElement("kind-inline-citation-item");
  item.setAttribute("value", id);
  item.innerHTML = ITEM_PARTS;
  return item;
};

/** Fills each item's empty parts with its source's host name, title and snippet. */
const fillItems = (content: Element, { entries }: InlineCitationState) => {
  for (const item of content.querySelectorAll("kind-inline-citation-item")) {
    const entry = entries[item.getAttribute("value") ?? ""];
    if (!entry) continue;
    fill(item.querySelector("kind-inline-citation-host"), entry.host);
    fill(item.querySelector("kind-inline-citation-source-title"), entry.title);
    fill(item.querySelector("kind-inline-citation-snippet"), entry.snippet);
  }
};

/**
 * Draws one item for a single source, else the Carousel with a slide per source, reusing the slide of a source with
 * the same id so the shown one stays put.
 */
const drawContent = (content: Element, ids: string[], controller: CarouselController) => {
  const doc = content.ownerDocument;
  if (ids.length > 1) {
    let carousel = content.querySelector("kind-inline-citation-carousel");
    if (!carousel) {
      carousel = doc.createElement("kind-inline-citation-carousel");
      carousel.innerHTML = CAROUSEL_PARTS;
      content.replaceChildren(carousel);
    }
    const element = carousel.querySelector<HTMLElement & { controller?: CarouselController }>("ui-carousel");
    if (element && element.controller !== controller) element.controller = controller;
    const row = carousel.querySelector<Movable>("ui-carousel-content");
    if (!row) return;
    const slides = new Map<string, Element>();
    for (const slide of row.children) slides.set(slide.firstElementChild?.getAttribute("value") ?? "", slide);
    let previous: Element | null = null;
    for (const id of ids) {
      let slide = slides.get(id);
      slides.delete(id);
      if (!slide) {
        slide = doc.createElement("ui-carousel-item");
        slide.append(createItem(doc, id));
      }
      const before: Element | null = previous ? previous.nextElementSibling : row.firstElementChild;
      if (before !== slide) move(row, slide, before);
      previous = slide;
    }
    for (const slide of slides.values()) slide.remove();
    return;
  }
  const [id] = ids;
  const item = content.querySelector(":scope > kind-inline-citation-item");
  if (id === undefined) content.replaceChildren();
  else if (item?.getAttribute("value") !== id) content.replaceChildren(createItem(doc, id));
};

/**
 * `<kind-inline-citation>` fills in its marker and card when it has no children. Set `sources` as a property: the
 * card shows one source, or a Carousel that pages through several.
 */
export function defineInlineCitation(): void {
  if (customElements.get("kind-inline-citation")) return;
  createParts(inlineCitationPrimitive, {
    root: {
      tag: "kind-inline-citation",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen"],
      render: (el, instance) => {
        if (!el.firstElementChild) {
          el.innerHTML = DEFAULT_PARTS;
          const content = el.querySelector("kind-inline-citation-content");
          if (content) owned.add(content);
        }
        const api = instance.api as InlineCitationApi;
        const draw = () => {
          const state = instance.get() as InlineCitationState;
          fill(el.querySelector("kind-inline-citation-trigger > button"), state.label);
          const content = el.querySelector("kind-inline-citation-content");
          if (!content) return;
          // Opening the card leaves focus on the marker, as React's default does.
          if (!content.hasAttribute("initial-focus")) content.setAttribute("initial-focus", "none");
          if (owned.has(content)) {
            const { controller, ids } = api.carouselState(state);
            drawContent(content, ids, controller);
          }
          fillItems(content, state);
          fill(content.querySelector("kind-inline-citation-index"), api.pageText(state));
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // Items and parts written after the element connects are filled in too.
        const arrivals = new MutationObserver((records) => {
          const changed = records.some((record) =>
            [...record.addedNodes].some((node) => node instanceof Element),
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
    trigger: { tag: "kind-inline-citation-trigger", target: wrappedButton, display: "contents" },
    content: "kind-inline-citation-content",
    carousel: "kind-inline-citation-carousel",
    item: "kind-inline-citation-item",
    link: { tag: "kind-inline-citation-link", target: wrappedChild("a"), display: "contents" },
    host: "kind-inline-citation-host",
    "source-title": "kind-inline-citation-source-title",
    snippet: "kind-inline-citation-snippet",
    index: "kind-inline-citation-index",
  });
}

export type KindInlineCitationEvents = {
  openchange: UiChangeEvent<boolean, InlineCitationOpenChangeReason>;
};

export interface KindInlineCitationElement
  extends UiElement<KindInlineCitationEvents>,
    AttributeProperties<typeof inlineCitationPrimitive, "api" | "open" | "sources"> {
  open: boolean;
  sources?: InlineCitationOptions["sources"];
  api: Pick<InlineCitationApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-inline-citation": KindInlineCitationElement;
    "kind-inline-citation-trigger": HTMLElement;
    "kind-inline-citation-content": HTMLElement;
    "kind-inline-citation-carousel": HTMLElement;
    "kind-inline-citation-item": UiPartElement<typeof inlineCitationPrimitive, "item", "value">;
    "kind-inline-citation-link": HTMLElement;
    "kind-inline-citation-host": HTMLElement;
    "kind-inline-citation-source-title": HTMLElement;
    "kind-inline-citation-snippet": HTMLElement;
    "kind-inline-citation-index": HTMLElement;
  }
}
