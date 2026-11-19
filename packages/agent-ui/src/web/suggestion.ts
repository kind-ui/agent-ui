import {
  type SuggestionApi,
  type SuggestionLayout,
  type SuggestionOptions,
  type SuggestionState,
  suggestionPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";
import { defineInternalCarousel } from "./internal/carousel.js";

// Lucide "chevron-left" and "chevron-right", see THIRD_PARTY_NOTICES.md.
const chevron = (path: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${path}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Previous and Next are hidden from agents, which takes the Carousel out of their snapshot: an agent picks any
// suggestion by its id with the Suggestion's own `pick`, wherever it has scrolled.
const DEFAULT_PARTS = `<kind-internal-carousel><ui-carousel slides-per-page="auto" drag-free><ui-carousel-viewport><ui-carousel-content></ui-carousel-content></ui-carousel-viewport><div data-suggestion-controls><ui-carousel-previous><button aria-label="Previous suggestions" data-agent-hidden>${chevron("m15 18-6-6 6-6")}</button></ui-carousel-previous><ui-carousel-next><button aria-label="Next suggestions" data-agent-hidden>${chevron("m9 18 6-6-6-6")}</button></ui-carousel-next></div></ui-carousel></kind-internal-carousel>`;

// Elements this element filled in, by the layout it filled them for, and so draws the suggestions of. One someone
// wrote keeps its suggestions, as React's children do. Kept across instances, because UI SDK rebuilds one when the
// element returns to the page.
const filled = new WeakMap<Element, SuggestionLayout>();
type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

const createSuggestion = (doc: Document, id: string, slide: boolean) => {
  const item = doc.createElement("kind-suggestion-item");
  item.setAttribute("value", id);
  item.innerHTML = `<button><span data-suggestion-label></span> <span data-suggestion-description></span></button>`;
  if (!slide) return item;
  const carouselItem = doc.createElement("ui-carousel-item");
  carouselItem.append(item);
  return carouselItem;
};

const setText = (el: Element | null, text: string) => {
  if (el && el.textContent !== text) el.textContent = text;
};

/**
 * Draws a slide (or, when the row wraps, a chip) for each suggestion, reusing the one of a suggestion with the same
 * id and moving only what is out of place, so a focused suggestion keeps focus. `moveBefore` doesn't take focus away,
 * where the browser has it.
 */
const drawSuggestions = (row: Movable, suggestions: SuggestionState["suggestions"], slides: boolean) => {
  const existing = new Map<string, Element>();
  for (const slide of row.querySelectorAll(
    `:scope > ${slides ? "ui-carousel-item" : "kind-suggestion-item"}`,
  ))
    existing.set(
      (slides ? slide.querySelector("kind-suggestion-item") : slide)?.getAttribute("value") ?? "",
      slide,
    );
  let previous: Element | null = null;
  for (const { id, label, description } of suggestions) {
    const slide = existing.get(id) ?? createSuggestion(row.ownerDocument, id, slides);
    existing.delete(id);
    setText(slide.querySelector("[data-suggestion-label]"), label);
    setText(slide.querySelector("[data-suggestion-description]"), description ?? "");
    const before: Element | null = previous ? previous.nextElementSibling : row.firstElementChild;
    if (before !== slide) {
      if (row.moveBefore && slide.isConnected) row.moveBefore(slide, before);
      else row.insertBefore(slide, before);
    }
    previous = slide;
  }
  for (const slide of existing.values()) slide.remove();
};

/**
 * `<kind-suggestion can-pick>` fills in its row when it has no children. Set `suggestions` as a property; the
 * `can-pick` attribute lets a person choose one, which fires `pick` with its id as `detail.value`. A row you write
 * yourself is the internal Carousel's markup, `kind-suggestion-item`s included, and keeps what you write in it. With
 * `layout="wrap"` there's no Carousel: the `kind-suggestion-item`s are its children.
 */
export function defineSuggestion(): void {
  if (customElements.get("kind-suggestion")) return;
  defineInternalCarousel();
  createParts(suggestionPrimitive, {
    root: {
      tag: "kind-suggestion",
      kinds: { canPick: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindSuggestionElement).canPick ? {} : { onPick: undefined }),
      api: ["getSuggestions"],
      render: (el, instance) => {
        const draw = () => {
          const { label, layout, suggestions } = instance.get() as SuggestionState;
          if (!el.firstElementChild && !filled.has(el)) filled.set(el, layout);
          const own = filled.get(el);
          if (own !== undefined && (own !== layout || !el.firstElementChild)) {
            filled.set(el, layout);
            if (layout === "wrap") el.replaceChildren();
            else el.innerHTML = DEFAULT_PARTS;
          }
          if (layout === "wrap") {
            if (filled.has(el)) drawSuggestions(el, suggestions, false);
            return;
          }
          const carousel = el.querySelector("ui-carousel");
          if (carousel && carousel.ariaLabel !== label) carousel.ariaLabel = label;
          const row = el.querySelector("ui-carousel-content");
          if (row && filled.has(el)) drawSuggestions(row, suggestions, true);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    item: { tag: "kind-suggestion-item", target: wrappedButton, display: "contents" },
  });
}

export type KindSuggestionEvents = {
  pick: UiDetailedChangeEvent<string, Parameters<NonNullable<SuggestionOptions["onPick"]>>[1]>;
};

export interface KindSuggestionElement
  extends UiElement<KindSuggestionEvents>,
    AttributeProperties<typeof suggestionPrimitive, "api" | "suggestions"> {
  canPick: boolean;
  suggestions?: SuggestionOptions["suggestions"];
  api: Pick<SuggestionApi, "getSuggestions">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-suggestion": KindSuggestionElement;
    "kind-suggestion-item": UiPartElement<typeof suggestionPrimitive, "item", "value">;
  }
}
