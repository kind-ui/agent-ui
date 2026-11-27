import {
  type ContextLimitRow,
  type ContextMeterApi,
  type ContextMeterOpenChangeReason,
  type ContextMeterOptions,
  type ContextMeterState,
  type ContextSlice,
  contextMeterPrimitive,
  WORDS,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import "@ui-sdk/web/meter";

const DETAILS = `<kind-context-meter-title><h2></h2></kind-context-meter-title><kind-context-meter-compact><button>${WORDS.compact}</button></kind-context-meter-compact><kind-context-meter-compacting hidden></kind-context-meter-compacting><kind-context-meter-description></kind-context-meter-description><kind-context-meter-bar hidden></kind-context-meter-bar><kind-context-meter-breakdown><ul></ul></kind-context-meter-breakdown><kind-context-meter-rows><dl></dl></kind-context-meter-rows><kind-context-meter-limits hidden></kind-context-meter-limits>`;

const DEFAULT_PARTS = `<kind-context-meter-trigger><button><kind-context-meter-value><ui-meter data-agent-hidden><ui-meter-track></ui-meter-track><ui-meter-value></ui-meter-value></ui-meter></kind-context-meter-value></button></kind-context-meter-trigger><kind-context-meter-content hidden>${DETAILS}</kind-context-meter-content>`;

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
// Each element's instance, which the content's portal reads to tell how it presents.
const instances = new WeakMap<Element, { get: () => unknown }>();
// The full-screen element each meter's sheet sits in, made the first time it presents as one.
const viewports = new WeakMap<Element, Element>();

const element = (tag: string, attrs: Record<string, string>, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

const drawSlices = (list: Element, slices: ContextSlice[]) =>
  list.replaceChildren(
    ...slices.map((slice) => {
      const row = element("li", { "data-color": String(slice.color) });
      row.append(
        element("span", { "data-context-meter-swatch": "", "aria-hidden": "true" }),
        element("span", { "data-context-meter-label": "" }, slice.label),
        element("span", { "data-context-meter-tokens": "" }, slice.value),
        element("span", { "data-context-meter-share": "" }, slice.percent),
      );
      return row;
    }),
  );

const drawSegments = (bar: Element, slices: ContextSlice[]) =>
  bar.replaceChildren(
    ...slices
      .filter((slice) => slice.color)
      .map((slice) => {
        const segment = element("span", {
          "data-context-meter-segment": "",
          "data-color": String(slice.color),
        });
        segment.style.width = slice.width;
        return segment;
      }),
  );

const drawLimits = (part: Element, limits: ContextLimitRow[]) =>
  part.replaceChildren(
    ...limits.map((limit) => {
      const meter = element("ui-meter", {
        "data-agent-hidden": "",
        "data-level": limit.low ? "high" : "normal",
      }) as MeterElement;
      const track = element("ui-meter-track", limit.pace === undefined ? {} : { "data-pace": "" });
      if (limit.pace !== undefined) track.style.setProperty("--kind-limit-pace", `${limit.pace * 100}%`);
      track.append(element("ui-meter-indicator", {}));
      meter.append(
        element("ui-meter-label", {}, limit.label),
        element("ui-meter-value", {}, limit.percent),
        track,
        ...(limit.detail ? [element("span", { "data-context-meter-detail": "" }, limit.detail)] : []),
      );
      meter.value = limit.value;
      meter.max = limit.max;
      meter.getValueLabel = () => limit.valueText;
      return meter;
    }),
  );

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

type MeterElement = HTMLElement & {
  value: number;
  max: number;
  locale: string | undefined;
  getValueLabel: (() => string) | undefined;
};

/**
 * `<kind-context-meter used="57600" total="128000">` fills in its parts when it has no children. Set `breakdown`,
 * `limits`, `usage` and `cost` as properties to list them in its details; `can-compact` shows Compact, which fires
 * `compact`. With `layout="inline"` the details sit in the page, without the ring.
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
      kinds: { canCompact: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindContextMeterElement).canCompact ? {} : { onCompact: undefined }),
      api: ["isOpen", "setOpen"],
      // A sheet sits in a full-screen viewport, which the content moves into while it presents as one.
      portal: {
        slots: ["content"],
        container: (el) => {
          if ((instances.get(el)?.get() as ContextMeterState | undefined)?.presentation !== "sheet")
            return null;
          let viewport = viewports.get(el);
          if (!viewport) {
            const created = el.ownerDocument.createElement("kind-context-meter-viewport");
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
        if (!el.firstElementChild)
          el.innerHTML = el.getAttribute("layout") === "inline" ? DETAILS : DEFAULT_PARTS;
        const api = instance.api as ContextMeterApi;
        let drawnRows: ReturnType<ContextMeterApi["rows"]> | undefined;
        let drawnBreakdown: ReturnType<ContextMeterApi["breakdownState"]> | undefined;
        let drawnLimits: ContextLimitRow[] | undefined;
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
          const titleText = state.levelText ? `${state.fullText} · ${state.levelText}` : state.fullText;
          if (owns(title) && title.textContent !== titleText) {
            title.textContent = state.fullText;
            if (state.levelText)
              title.append(element("span", { "data-context-meter-level": "" }, ` · ${state.levelText}`));
          }
          const caption = el.querySelector("kind-context-meter-value ui-meter [data-context-meter-caption]");
          const { caption: captionText } = api.valueState(state);
          if (captionText && !caption)
            meter
              ?.querySelector("ui-meter-value")
              ?.before(element("span", { "data-context-meter-caption": "" }, `${captionText} `));
          else if (caption && caption.textContent !== `${captionText} `) {
            if (captionText) caption.textContent = `${captionText} `;
            else caption.remove();
          }
          const compacting = el.querySelector("kind-context-meter-compacting");
          if (owns(compacting) && !compacting.firstChild)
            compacting.append(
              element("kind-context-meter-compacting-icon", {}),
              document.createTextNode(WORDS.compacting),
            );
          const breakdown = api.breakdownState(state);
          if (breakdown !== drawnBreakdown) {
            drawnBreakdown = breakdown;
            const bar = el.querySelector("kind-context-meter-bar");
            if (owns(bar)) drawSegments(bar, breakdown.slices);
            const list = el.querySelector("kind-context-meter-breakdown > ul");
            if (owns(list)) drawSlices(list, breakdown.slices);
          }
          const limits = api.limitRows(state);
          const limitsPart = el.querySelector("kind-context-meter-limits");
          if (limits !== drawnLimits && owns(limitsPart)) {
            drawnLimits = limits;
            drawLimits(limitsPart, limits);
          }
          const description = el.querySelector("kind-context-meter-description");
          const countText = api.countText(state);
          if (owns(description) && description.textContent !== countText) description.textContent = countText;
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
    rows: { tag: "kind-context-meter-rows", target: wrappedChild("dl"), display: "contents" },
    viewport: "kind-context-meter-viewport",
    compact: { tag: "kind-context-meter-compact", target: wrappedButton, display: "contents" },
    compacting: "kind-context-meter-compacting",
    "compacting-icon": "kind-context-meter-compacting-icon",
    bar: "kind-context-meter-bar",
    breakdown: { tag: "kind-context-meter-breakdown", target: wrappedChild("ul"), display: "contents" },
    limits: "kind-context-meter-limits",
  });
}

export type KindContextMeterEvents = {
  openchange: UiChangeEvent<boolean, ContextMeterOpenChangeReason>;
  compact: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindContextMeterElement
  extends UiElement<KindContextMeterEvents>,
    AttributeProperties<typeof contextMeterPrimitive, "api" | "open" | "usage" | "breakdown" | "limits"> {
  open: boolean;
  canCompact: boolean;
  usage?: ContextMeterOptions["usage"];
  breakdown?: ContextMeterOptions["breakdown"];
  limits?: ContextMeterOptions["limits"];
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
    "kind-context-meter-rows": HTMLElement;
    "kind-context-meter-viewport": HTMLElement;
    "kind-context-meter-compact": HTMLElement;
    "kind-context-meter-compacting": HTMLElement;
    "kind-context-meter-compacting-icon": HTMLElement;
    "kind-context-meter-bar": HTMLElement;
    "kind-context-meter-breakdown": HTMLElement;
    "kind-context-meter-limits": HTMLElement;
  }
}
