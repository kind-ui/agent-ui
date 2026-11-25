import {
  type TraceApi,
  type TraceExpandedChangeReason,
  type TraceOptions,
  type TraceRow,
  type TraceState,
  type TraceValueChangeReason,
  tracePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalWaterfall } from "./internal/waterfall.js";

// Lucide "chevron-right", see THIRD_PARTY_NOTICES.md.
const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

type WaterfallElement = HTMLElement & Record<string, unknown>;

const element = (document: Document, tag: string, attributes: Record<string, string> = {}, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

const headerRow = (document: Document) => {
  const row = element(document, "ui-waterfall-header-row", { "aria-rowindex": "1" });
  const timeline = element(document, "ui-waterfall-column-header");
  timeline.append(element(document, "span", { class: "sr-only" }, "Timeline"));
  const axis = element(document, "kind-trace-axis");
  // Hidden from agents, which hides UI SDK's Waterfall from them while the rows stay the Trace's.
  axis.append(element(document, "ui-waterfall-axis", { "max-ticks": "5", "data-agent-hidden": "" }));
  timeline.append(axis);
  row.append(
    element(document, "ui-waterfall-column-header", {}, "Name"),
    element(document, "ui-waterfall-column-header", {}, "Duration"),
    timeline,
  );
  return row;
};

const newRow = (document: Document, row: TraceRow) => {
  const el = element(document, "ui-waterfall-row");
  const header = element(document, "ui-waterfall-row-header");
  if (row.branch) {
    const indicator = element(document, "ui-waterfall-indicator");
    indicator.innerHTML = CHEVRON;
    header.append(indicator);
  } else header.append(element(document, "span", { "data-trace-spacer": "" }));
  const name = element(document, "kind-trace-name", { value: row.key });
  // A space keeps the name and the status apart in the row header's accessible name.
  name.append(element(document, "span", { "data-trace-label": "" }), " ");
  name.append(element(document, "kind-trace-status", { value: row.key }));
  header.append(name);
  const cell = element(document, "ui-waterfall-cell");
  cell.append(element(document, "kind-trace-duration", { value: row.key }));
  const bar = element(document, "ui-waterfall-bar");
  bar.append(element(document, "kind-trace-bar", { value: row.key }));
  el.append(header, cell, bar);
  return el;
};

const setText = (el: Element | null | undefined, text: string) => {
  if (el && el.textContent !== text) el.textContent = text;
};

/** Draws the rows in view at their offsets, reusing each span's element so a focused row keeps focus. */
const drawRows = (waterfall: Element, state: TraceState, api: TraceApi) => {
  const document = waterfall.ownerDocument;
  const existing = new Map<string, HTMLElement>();
  const wanted = new Map(state.rows.map((row) => [row.key, row]));
  for (const el of waterfall.querySelectorAll<HTMLElement>(":scope > ui-waterfall-row")) {
    const value = el.getAttribute("value") ?? "";
    const row = wanted.get(value);
    // A row whose span gained or lost children is drawn again, for its arrow.
    if (row && el.hasAttribute("data-trace-branch") === row.branch) existing.set(value, el);
    else el.remove();
  }
  for (const row of state.rows) {
    let el = existing.get(row.key);
    if (!el) {
      el = newRow(document, row);
      if (row.branch) el.setAttribute("data-trace-branch", "");
      waterfall.append(el);
    }
    for (const [name, value] of Object.entries(row.props))
      if (el.getAttribute(name) !== String(value)) el.setAttribute(name, String(value));
    const top = `${row.top}px`;
    if (el.style.top !== top) el.style.top = top;
    const entry = Object.hasOwn(state.entries, row.key) ? state.entries[row.key] : undefined;
    setText(el.querySelector("[data-trace-label]"), entry?.name ?? "");
    setText(el.querySelector("kind-trace-duration"), api.durationText(state, row.key));
  }
};

const drawDetails = (details: Element, state: TraceState, api: TraceApi) => {
  const document = details.ownerDocument;
  if (!details.firstElementChild) {
    const header = element(document, "div", { "data-trace-details-header": "" });
    const close = element(document, "kind-trace-details-close");
    close.append(element(document, "button", { type: "button" }));
    header.append(element(document, "p", { "data-trace-details-title": "" }), close);
    details.append(header, element(document, "dl"));
  }
  const { name, rows } = api.detailsState(state);
  setText(details.querySelector("[data-trace-details-title]"), name);
  const list = details.querySelector(":scope > dl");
  if (!list) return;
  const text = rows.map(({ term, detail }) => `${term}\u0000${detail}`).join("\u0001");
  if (list.getAttribute("data-drawn") === text) return;
  list.setAttribute("data-drawn", text);
  list.replaceChildren(
    ...rows.flatMap(({ term, detail }) => [element(document, "dt", {}, term), element(document, "dd", {}, detail)]),
  );
};

/**
 * `<kind-trace>` draws its spans from `spans`, set as a property, as UI SDK Waterfall rows; only the rows in view are
 * in the page. Selecting a span fires `spanselect` and expanding or collapsing fires `expandchange`, each with the
 * id or ids as `detail.value`.
 */
export function defineTrace(): void {
  if (customElements.get("kind-trace")) return;
  defineInternalWaterfall();
  createParts(tracePrimitive, {
    root: {
      tag: "kind-trace",
      state: {
        value: { get: (api) => api.getValue(), set: (api, value) => api.setValue(value as string | null) },
        expanded: {
          get: (api) => api.getExpanded(),
          set: (api, value) => api.setExpanded(value as string[]),
        },
      },
      // The inner Waterfall fires `valuechange` and `expandedchange` of its own.
      events: { onValueChange: "spanselect", onExpandedChange: "expandchange" },
      api: ["getValue", "setValue", "getExpanded", "setExpanded", "select", "expand", "collapse"],
      render: (el, instance) => {
        const api = instance.api as TraceApi;
        const document = el.ownerDocument;
        let viewport = el.querySelector(":scope > kind-trace-viewport");
        let details = el.querySelector(":scope > kind-trace-details");
        if (!viewport) {
          viewport = element(document, "kind-trace-viewport");
          details = element(document, "kind-trace-details");
          el.replaceChildren(viewport, details);
        }
        // The Waterfall draws bare rows of its own from `items` when it has none, so it gets our rows and its
        // defaults before it connects.
        let waterfall = viewport.querySelector<WaterfallElement>("ui-waterfall");
        if (!waterfall) {
          const state = instance.get() as TraceState;
          const { waterfall: props } = api.viewportState(state);
          waterfall = element(document, "ui-waterfall") as WaterfallElement;
          waterfall.append(headerRow(document));
          drawRows(waterfall, state, api);
          waterfall.defaultValue = props.defaultValue;
          waterfall.defaultExpanded = props.defaultExpanded;
          const host = element(document, "kind-internal-waterfall");
          host.append(waterfall);
          viewport.replaceChildren(host);
        }
        const shown = waterfall;
        const draw = () => {
          const state = instance.get() as TraceState;
          const { waterfall: props, height } = api.viewportState(state);
          drawRows(shown, state, api);
          // UI SDK builds a new instance, with a new controller, when the element returns to the page.
          // The Waterfall draws bare rows of its own for `items` while it has none of ours.
          const keys = ["controller", "items", "range", "locale", "getBarLabel"] as const;
          for (const key of keys)
            if (shown[key] !== props[key] && (key !== "items" || state.rows.length || !props.items.length))
              shown[key] = props[key];
          const attributes = { "aria-label": props["aria-label"], "aria-rowcount": String(props["aria-rowcount"]) };
          for (const [name, value] of Object.entries(attributes))
            if (shown.getAttribute(name) !== value) shown.setAttribute(name, value);
          const size = `${height}px`;
          if (shown.style.height !== size) shown.style.height = size;
          const panel = el.querySelector(":scope > kind-trace-details");
          if (panel && state.value !== null) drawDetails(panel, state, api);
          api.syncWaterfall();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    viewport: "kind-trace-viewport",
    axis: "kind-trace-axis",
    name: "kind-trace-name",
    status: "kind-trace-status",
    duration: "kind-trace-duration",
    bar: "kind-trace-bar",
    details: "kind-trace-details",
    "details-close": { tag: "kind-trace-details-close", target: wrappedButton, display: "contents" },
  });
}

export type KindTraceEvents = {
  spanselect: UiChangeEvent<string | null, TraceValueChangeReason>;
  expandchange: UiChangeEvent<string[], TraceExpandedChangeReason>;
};

export interface KindTraceElement
  extends UiElement<KindTraceEvents>,
    AttributeProperties<
      typeof tracePrimitive,
      "api" | "spans" | "value" | "defaultValue" | "expanded" | "defaultExpanded" | "range" | "now"
    > {
  spans?: TraceOptions["spans"];
  get value(): string | null;
  set value(id: string | null);
  defaultValue?: string | null;
  get expanded(): string[];
  set expanded(ids: string[]);
  defaultExpanded?: string[];
  range?: TraceOptions["range"];
  now?: TraceOptions["now"];
  api: Pick<TraceApi, "getValue" | "setValue" | "getExpanded" | "setExpanded" | "select" | "expand" | "collapse">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-trace": KindTraceElement;
    "kind-trace-viewport": HTMLElement;
    "kind-trace-axis": HTMLElement;
    "kind-trace-name": HTMLElement;
    "kind-trace-status": HTMLElement;
    "kind-trace-duration": HTMLElement;
    "kind-trace-bar": HTMLElement;
    "kind-trace-details": HTMLElement;
    "kind-trace-details-close": HTMLElement;
  }
}
