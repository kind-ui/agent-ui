import {
  type RunTimelineApi,
  type RunTimelineLoadDetails,
  type RunTimelineOptions,
  type RunTimelineState,
  runTimelinePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiElement, UiPartElement, UiTimelineElement } from "@ui-sdk/web/events";
import { defineInternalTimeline } from "./internal/timeline.js";
import { defineMarkdown, type KindMarkdownElement } from "./markdown.js";

const LOADING = `<span data-status-mark data-status="running" aria-hidden="true"></span>Loading`;

// The entry each element was last drawn from, so a redraw writes only events that changed.
const drawn = new WeakMap<Element, RunTimelineState["entries"][string]>();

const element = (document: Document, tag: string, attributes: Record<string, string> = {}) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
};

// The connector is hidden from agents, which hides UI SDK's Timeline from them (a component with a part under
// `data-agent-hidden` is off limits) while the events stay the Run Timeline's.
const newEvent = (document: Document, value: string) => {
  const item = element(document, "kind-run-timeline-item", { value });
  const timelineItem = element(document, "ui-timeline-item", { value });
  const marker = element(document, "ui-timeline-marker");
  marker.append(element(document, "kind-run-timeline-marker"));
  const title = element(document, "ui-timeline-title");
  title.append(element(document, "kind-run-timeline-title"));
  // `ui-timeline-time` binds the `<time>` inside it, so that's there before it connects.
  const time = element(document, "ui-timeline-time");
  const timeElement = element(document, "time");
  timeElement.append(element(document, "kind-run-timeline-time"));
  time.append(timeElement);
  timelineItem.append(
    marker,
    element(document, "ui-timeline-connector", { "data-agent-hidden": "" }),
    title,
    time,
  );
  item.append(timelineItem);
  return item;
};

/** Writes an event's words and its description part, which holds the actor and the Markdown. */
const drawEvent = (item: Element, entry: RunTimelineState["entries"][string]) => {
  if (drawn.get(item) === entry) return;
  drawn.set(item, entry);
  const document = item.ownerDocument;
  const timelineItem = item.querySelector(":scope > ui-timeline-item");
  if (!timelineItem) return;
  if (entry.current) timelineItem.setAttribute("status", "current");
  else timelineItem.removeAttribute("status");
  const title = timelineItem.querySelector("kind-run-timeline-title");
  if (title) {
    title.textContent = entry.title;
    if (entry.statusText) {
      const status = element(document, "span", { "data-run-timeline-status": "" });
      status.textContent = ` (${entry.statusText})`;
      title.append(status);
    }
  }
  timelineItem.querySelector(":scope > ui-timeline-time > time")?.setAttribute("datetime", entry.at);
  let description = timelineItem.querySelector(":scope > ui-timeline-description");
  if (!entry.actor && !entry.description) {
    description?.remove();
    return;
  }
  if (!description) {
    description = element(document, "ui-timeline-description");
    const markdown = element(document, "kind-markdown");
    const part = element(document, "kind-run-timeline-description");
    part.append(markdown);
    description.append(element(document, "kind-run-timeline-actor"), part);
    timelineItem.append(description);
  }
  const actor = description.querySelector("kind-run-timeline-actor");
  if (actor && actor.textContent !== entry.actor) actor.textContent = entry.actor;
  const markdown = description.querySelector<KindMarkdownElement>("kind-markdown");
  if (markdown && markdown.source !== entry.description) markdown.source = entry.description;
};

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused event focused where the browser has it; `insertBefore` blurs it.
const place = (parent: Movable, child: Element, before: Element | null) => {
  if (before === child || (child.parentElement === parent && child.nextElementSibling === before)) return;
  if (parent.moveBefore && child.isConnected) parent.moveBefore(child, before);
  else parent.insertBefore(child, before);
};

/** Draws the events into the Timeline, reusing each id's element so focus stays, and writes each one's time. */
const drawEvents = (timeline: Element, state: RunTimelineState, api: RunTimelineApi) => {
  const { rows, entries } = state;
  const existing = new Map<string, Element>();
  const wanted = new Set(rows);
  // Events that left go first, so the rest are already in place and keep focus where the browser has no `moveBefore`.
  for (const item of timeline.querySelectorAll(":scope > kind-run-timeline-item")) {
    const value = item.getAttribute("value") ?? "";
    if (wanted.has(value)) existing.set(value, item);
    else item.remove();
  }
  let previous: Element | null = null;
  for (const id of rows) {
    const item = existing.get(id) ?? newEvent(timeline.ownerDocument, id);
    drawEvent(item, entries[id] as RunTimelineState["entries"][string]);
    const time = item.querySelector("kind-run-timeline-time");
    const { label } = api.timeState(state, id);
    if (time && time.textContent !== label) time.textContent = label;
    place(timeline, item, previous ? previous.nextElementSibling : timeline.firstElementChild);
    previous = item;
  }
};

/** Fills the end with Show earlier, or "Loading" without it, and Show earlier with its words. */
const drawEnd = (end: Element, { busy, canLoadMore }: RunTimelineState) => {
  let more = end.querySelector(":scope > kind-run-timeline-more");
  if (canLoadMore) {
    if (!more) {
      more = element(end.ownerDocument, "kind-run-timeline-more");
      more.append(element(end.ownerDocument, "button"));
      end.replaceChildren(more);
    }
    const button = more.querySelector(":scope > button");
    const html = busy ? LOADING : "Show earlier";
    if (button && button.innerHTML !== html) button.innerHTML = html;
  } else if (end.innerHTML !== LOADING) end.innerHTML = LOADING;
};

/**
 * `<kind-run-timeline>` draws its events into a UI SDK Timeline from `events`, set as a property. With
 * `can-load-more`, Show earlier fires `loadmore` with the reason as `detail.reason`.
 */
export function defineRunTimeline(): void {
  if (customElements.get("kind-run-timeline")) return;
  defineInternalTimeline();
  defineMarkdown();
  createParts(runTimelinePrimitive, {
    root: {
      tag: "kind-run-timeline",
      kinds: { canLoadMore: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindRunTimelineElement).canLoadMore ? {} : { onLoadMore: undefined }),
      events: { onLoadMore: "loadmore" },
      render: (el, instance) => {
        // An element put back in the page keeps what it drew.
        const document = el.ownerDocument;
        const timeline =
          el.querySelector<UiTimelineElement>(":scope > kind-internal-timeline > ui-timeline") ??
          document.createElement("ui-timeline");
        const host = timeline.parentElement ?? document.createElement("kind-internal-timeline");
        if (!timeline.parentElement) host.append(timeline);
        const end =
          el.querySelector(":scope > kind-run-timeline-end") ??
          document.createElement("kind-run-timeline-end");
        const draw = () => {
          const state = instance.get() as RunTimelineState;
          drawEvents(timeline, state, instance.api as RunTimelineApi);
          if (host.parentElement !== el) el.replaceChildren(host);
          if (timeline.ariaLabel !== state.label) timeline.ariaLabel = state.label;
          if (timeline.feed !== state.feed) timeline.feed = state.feed;
          if (timeline.busy !== state.busy) timeline.busy = state.busy;
          drawEnd(end, state);
          // Show earlier sits before the oldest event.
          if (state.order === "oldest-first") place(el, end, host);
          else place(el, end, null);
        };
        // The Timeline's events are drawn before it connects.
        draw();
        return instance.subscribe(draw);
      },
    },
    item: "kind-run-timeline-item",
    marker: "kind-run-timeline-marker",
    title: "kind-run-timeline-title",
    time: "kind-run-timeline-time",
    actor: "kind-run-timeline-actor",
    description: "kind-run-timeline-description",
    end: "kind-run-timeline-end",
    more: { tag: "kind-run-timeline-more", target: wrappedButton, display: "contents" },
  });
}

export type KindRunTimelineEvents = {
  loadmore: CustomEvent<RunTimelineLoadDetails>;
};

export interface KindRunTimelineElement
  extends UiElement<KindRunTimelineEvents>,
    AttributeProperties<typeof runTimelinePrimitive, "events"> {
  events?: RunTimelineOptions["events"];
  /** Whether Show earlier fires `loadmore` while `has-more`. */
  canLoadMore: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-run-timeline": KindRunTimelineElement;
    "kind-run-timeline-item": UiPartElement<typeof runTimelinePrimitive, "item", "value">;
    "kind-run-timeline-marker": HTMLElement;
    "kind-run-timeline-title": HTMLElement;
    "kind-run-timeline-time": HTMLElement;
    "kind-run-timeline-actor": HTMLElement;
    "kind-run-timeline-description": HTMLElement;
    "kind-run-timeline-end": HTMLElement;
    "kind-run-timeline-more": HTMLElement;
  }
}
