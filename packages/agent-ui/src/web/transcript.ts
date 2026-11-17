import "@ui-sdk/web/input";
import {
  type TranscriptApi,
  type TranscriptQueryChangeReason,
  type TranscriptSeekReason,
  type TranscriptState,
  transcriptPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const DEFAULT_PARTS = `<kind-transcript-search><ui-input-group><ui-input><input type="search" placeholder="Search" data-agent-hidden></ui-input><kind-transcript-count></kind-transcript-count><ui-input-clear><button type="button" aria-label="Clear search" data-agent-hidden></button></ui-input-clear></ui-input-group></kind-transcript-search><kind-transcript-viewport><kind-transcript-list></kind-transcript-list></kind-transcript-viewport>`;

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused time focused where the browser has it; `insertBefore` blurs it.
const place = (parent: Movable, child: Element, before: Element | null) => {
  if (before === child) return;
  if (parent.moveBefore && child.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

const marked = (document: Document, segments: { text: string; match: boolean }[]) =>
  segments.map(({ text, match }) => {
    if (!match) return document.createTextNode(text);
    const mark = document.createElement("mark");
    mark.textContent = text;
    return mark;
  });

// The marked pieces each speaker and word element shows. A piece the search marks as it did keeps its array.
const drawnPieces = new WeakMap<Element, unknown>();

const drawPiece = (el: Element | null | undefined, piece: { text: string; match: boolean }[]) => {
  if (!el || drawnPieces.get(el) === piece) return;
  drawnPieces.set(el, piece);
  el.replaceChildren(...marked(el.ownerDocument, piece));
};

/** What each segment element was last drawn from, so a redraw writes only segments that changed. */
type Drawn = { segment: unknown; query: string; canSeek: boolean; time: string };
const drawn = new WeakMap<Element, Drawn>();

/** Fills a segment element with its speaker, its time, a seek button while `canSeek`, and its words. */
const drawSegment = (el: Element, id: string, state: TranscriptState, api: TranscriptApi) => {
  const next: Drawn = {
    segment: state.segmentsById[id],
    query: state.query,
    canSeek: state.canSeek,
    time: api.timeOf(id),
  };
  const last = drawn.get(el);
  if (
    last &&
    last.segment === next.segment &&
    last.query === next.query &&
    last.canSeek === next.canSeek &&
    last.time === next.time
  ) {
    return;
  }
  drawn.set(el, next);
  const document = el.ownerDocument;
  const { speaker, words } = api.highlights(state, id);
  const rebuilt = !last || last.canSeek !== next.canSeek;
  if (rebuilt) {
    const header = document.createElement("div");
    header.setAttribute("data-transcript-header", "");
    const time = document.createElement("kind-transcript-time");
    if (next.canSeek) {
      const seek = document.createElement("kind-transcript-seek");
      const button = document.createElement("button");
      button.append(time);
      seek.append(button);
      header.append(document.createElement("kind-transcript-speaker"), seek);
    } else {
      header.append(document.createElement("kind-transcript-speaker"), time);
    }
    el.replaceChildren(header, document.createElement("kind-transcript-text"));
  }
  drawPiece(el.querySelector("kind-transcript-speaker"), speaker);
  const time = el.querySelector("kind-transcript-time");
  if (time && time.textContent !== next.time) time.textContent = next.time;
  const text = el.querySelector("kind-transcript-text");
  if (!text) return;
  if (rebuilt || last.segment !== next.segment) {
    text.replaceChildren(
      ...api.wordValues(state, id).flatMap((value, index) => {
        const word = document.createElement("kind-transcript-word");
        word.setAttribute("value", value);
        return index > 0 ? [document.createTextNode(" "), word] : [word];
      }),
    );
  }
  text.querySelectorAll(":scope > kind-transcript-word").forEach((word, index) => {
    drawPiece(word, words[index] ?? []);
  });
};

// Each list's segment elements by id, so drawing reads no attributes.
const segmentElements = new WeakMap<Element, Map<string, Element>>();

/** Draws a `kind-transcript-segment` for each segment in view, reusing each segment's element. */
const drawSegments = (list: Element, state: TranscriptState, api: TranscriptApi) => {
  const existing = segmentElements.get(list) ?? new Map<string, Element>();
  const wanted = new Set(state.rows.map((row) => row.key));
  // Segments that left go first, so the rest are already in order.
  for (const [id, segment] of existing) {
    if (wanted.has(id)) continue;
    segment.remove();
    existing.delete(id);
  }
  let previous: Element | null = null;
  for (const row of state.rows) {
    let segment = existing.get(row.key);
    if (!segment) {
      segment = list.ownerDocument.createElement("kind-transcript-segment");
      segment.setAttribute("value", row.key);
      existing.set(row.key, segment);
    }
    drawSegment(segment, row.key, state, api);
    place(list, segment, previous ? previous.nextElementSibling : list.firstElementChild);
    previous = segment;
  }
  segmentElements.set(list, existing);
};

/**
 * `<kind-transcript>` fills in its parts when it has no children, and draws the segments in view into its
 * `kind-transcript-list`. Set `segments` as a property. Searching fires `querychange`, and with `can-seek` a press on a
 * segment or its time fires `seek`, with the segment's start in seconds as `detail.value`.
 */
export function defineTranscript(): void {
  if (customElements.get("kind-transcript")) return;
  createParts(transcriptPrimitive, {
    root: {
      tag: "kind-transcript",
      kinds: { canSeek: "boolean" },
      state: {
        query: { get: (api) => api.getQuery(), set: (api, query) => api.search(String(query ?? "")) },
      },
      // `seek` is a getter, offered only with `can-seek`, which a copied list of methods would freeze.
      api: ["search", "getQuery", "getSegments"],
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindTranscriptElement).canSeek ? {} : { onSeek: undefined }),
      render: (el, instance) => {
        const api = instance.api as TranscriptApi;
        if (!el.firstElementChild) {
          el.innerHTML = DEFAULT_PARTS;
          const input = el.querySelector("input");
          if (input) input.value = (instance.get() as TranscriptState).query;
        }
        const draw = () => {
          const state = instance.get() as TranscriptState;
          // UI SDK builds a new instance, with a new controller, when the element returns to the page.
          const field = el.querySelector<Element & { controller?: unknown }>(
            "kind-transcript-search ui-input",
          );
          const { controller, label } = api.searchState();
          if (field && field.controller !== controller) field.controller = controller;
          const input = field?.querySelector("input");
          if (input && input.ariaLabel !== label) input.ariaLabel = label;
          const count = el.querySelector("kind-transcript-count");
          const text = api.countText(state);
          if (count && count.textContent !== text) count.textContent = text;
          const list = el.querySelector("kind-transcript-list");
          if (list) drawSegments(list, state, api);
          api.syncQuery();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    search: "kind-transcript-search",
    count: "kind-transcript-count",
    viewport: "kind-transcript-viewport",
    list: "kind-transcript-list",
    segment: "kind-transcript-segment",
    speaker: "kind-transcript-speaker",
    seek: { tag: "kind-transcript-seek", target: wrappedButton, display: "contents" },
    time: "kind-transcript-time",
    text: "kind-transcript-text",
    word: "kind-transcript-word",
  });
}

export type KindTranscriptEvents = {
  querychange: UiChangeEvent<string, TranscriptQueryChangeReason>;
  seek: UiChangeEvent<number, TranscriptSeekReason>;
};

export interface KindTranscriptElement
  extends UiElement<KindTranscriptEvents>,
    AttributeProperties<typeof transcriptPrimitive, "api" | "segments" | "query"> {
  segments?: TranscriptState["segments"];
  get query(): string;
  set query(query: string);
  /** Whether a press on a segment or its time fires `seek`, and agents may `seek`. */
  canSeek: boolean;
  api: Pick<TranscriptApi, "search" | "getQuery" | "getSegments">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-transcript": KindTranscriptElement;
    "kind-transcript-search": HTMLElement;
    "kind-transcript-count": HTMLElement;
    "kind-transcript-viewport": HTMLElement;
    "kind-transcript-list": HTMLElement;
    "kind-transcript-segment": HTMLElement;
    "kind-transcript-speaker": HTMLElement;
    "kind-transcript-seek": HTMLElement;
    "kind-transcript-time": HTMLElement;
    "kind-transcript-text": HTMLElement;
    "kind-transcript-word": HTMLElement;
  }
}
