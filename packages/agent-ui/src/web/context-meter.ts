import {
  type ContextMeterApi,
  type ContextMeterOpenChangeReason,
  type ContextMeterOptions,
  type ContextMeterState,
  contextMeterPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import "@ui-sdk/web/meter";

const DEFAULT_PARTS = `<kind-context-meter-trigger><button><kind-context-meter-value><ui-meter data-agent-hidden><ui-meter-track></ui-meter-track><ui-meter-value></ui-meter-value></ui-meter></kind-context-meter-value></button></kind-context-meter-trigger><kind-context-meter-content hidden><kind-context-meter-title><h2></h2></kind-context-meter-title><kind-context-meter-description></kind-context-meter-description><kind-context-meter-breakdown></kind-context-meter-breakdown><kind-context-meter-breakdown-rows><dl></dl></kind-context-meter-breakdown-rows><kind-context-meter-rows><dl></dl></kind-context-meter-rows></kind-context-meter-content>`;

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const owns = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

type Slices = ReturnType<ContextMeterApi["slices"]>;

// The breakdown's bar and rows, as React's defaults draw them.
const drawSlices = (bar: Element | null, list: Element | null, slices: Slices) => {
  if (owns(bar))
    bar.replaceChildren(
      ...slices.map(({ width, color }) => {
        const segment = document.createElement("span");
        segment.dataset.slice = String(color);
        segment.style.width = width;
        return segment;
      }),
    );
  if (owns(list))
    list.replaceChildren(
      ...slices.map(({ label, value, percent, color }) => {
        const row = document.createElement("div");
        row.dataset.slice = String(color);
        row.append(
          Object.assign(document.createElement("dt"), { textContent: label }),
          Object.assign(document.createElement("dd"), { textContent: value }),
          Object.assign(document.createElement("dd"), { textContent: percent }),
        );
        return row;
      }),
    );
};

type MeterElement = HTMLElement & {
  value: number;
  max: number;
  locale: string | undefined;
  getValueLabel: (() => string) | undefined;
};

/**
 * `<kind-context-meter used="57600" total="128000">` fills in its parts when it has no children. Set `usage`,
 * `cost` and `breakdown` as properties to list the counts, cost and what fills the window in its details.
 */
export function defineContextMeter(): void {
  if (customElements.get("kind-context-meter")) return;
  createParts(contextMeterPrimitive, {
    root: {
      tag: "kind-context-meter",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as ContextMeterApi;
        let drawnRows: ReturnType<ContextMeterApi["rows"]> | undefined;
        let drawnSlices: Slices | undefined;
        const draw = () => {
          const state = instance.get() as ContextMeterState;
          // The details hold nothing to press, so opening them leaves focus on the trigger, as React's default does.
          const content = el.querySelector("kind-context-meter-content");
          if (content && !content.hasAttribute("initial-focus"))
            content.setAttribute("initial-focus", "none");
          const meter = el.querySelector<MeterElement>("kind-context-meter-value ui-meter");
          const { value, max, locale, label, getValueLabel } = api.valueState(state);
          write(meter, "value", value);
          write(meter, "max", max);
          write(meter, "locale", locale);
          write(meter, "getValueLabel", getValueLabel);
          write(meter, "ariaLabel", label);
          const title = el.querySelector("kind-context-meter-title > h2");
          if (owns(title) && title.textContent !== state.label) title.textContent = state.label;
          const description = el.querySelector("kind-context-meter-description");
          const countText = api.countText(state);
          if (owns(description) && description.textContent !== countText) description.textContent = countText;
          const slices = api.slices(state);
          if (slices !== drawnSlices) {
            drawnSlices = slices;
            drawSlices(
              el.querySelector("kind-context-meter-breakdown"),
              el.querySelector("kind-context-meter-breakdown-rows > dl"),
              slices,
            );
          }
          const rows = api.rows(state);
          const list = el.querySelector("kind-context-meter-rows > dl");
          if (rows !== drawnRows && owns(list)) {
            drawnRows = rows;
            list.replaceChildren(
              ...rows.map(({ label, value }) => {
                const row = document.createElement("div");
                row.append(
                  Object.assign(document.createElement("dt"), { textContent: label }),
                  Object.assign(document.createElement("dd"), { textContent: value }),
                );
                return row;
              }),
            );
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        return unsubscribe;
      },
    },
    trigger: { tag: "kind-context-meter-trigger", target: wrappedButton, display: "contents" },
    value: { tag: "kind-context-meter-value", display: "contents" },
    content: "kind-context-meter-content",
    title: { tag: "kind-context-meter-title", target: wrappedChild("h2"), display: "contents" },
    description: "kind-context-meter-description",
    breakdown: "kind-context-meter-breakdown",
    "breakdown-rows": {
      tag: "kind-context-meter-breakdown-rows",
      target: wrappedChild("dl"),
      display: "contents",
    },
    rows: { tag: "kind-context-meter-rows", target: wrappedChild("dl"), display: "contents" },
  });
}

export type KindContextMeterEvents = {
  openchange: UiChangeEvent<boolean, ContextMeterOpenChangeReason>;
};

export interface KindContextMeterElement
  extends UiElement<KindContextMeterEvents>,
    AttributeProperties<typeof contextMeterPrimitive, "api" | "open" | "usage" | "breakdown"> {
  open: boolean;
  usage?: ContextMeterOptions["usage"];
  breakdown?: ContextMeterOptions["breakdown"];
  api: Pick<ContextMeterApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-context-meter": KindContextMeterElement;
    "kind-context-meter-trigger": HTMLElement;
    "kind-context-meter-value": HTMLElement;
    "kind-context-meter-content": HTMLElement;
    "kind-context-meter-title": HTMLElement;
    "kind-context-meter-description": HTMLElement;
    "kind-context-meter-breakdown": HTMLElement;
    "kind-context-meter-breakdown-rows": HTMLElement;
    "kind-context-meter-rows": HTMLElement;
  }
}
