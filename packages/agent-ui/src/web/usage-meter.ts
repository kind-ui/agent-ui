import {
  type UsageMeterApi,
  type UsageMeterOpenChangeReason,
  type UsageMeterOptions,
  type UsageMeterState,
  usageMeterPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import "@ui-sdk/web/meter";

const DEFAULT_PARTS = `<kind-usage-meter-trigger><button><kind-usage-meter-value><ui-meter data-agent-hidden><ui-meter-track></ui-meter-track><ui-meter-value></ui-meter-value></ui-meter></kind-usage-meter-value></button></kind-usage-meter-trigger><kind-usage-meter-content hidden><kind-usage-meter-title><h2></h2></kind-usage-meter-title><kind-usage-meter-description></kind-usage-meter-description><kind-usage-meter-period></kind-usage-meter-period><kind-usage-meter-breakdown></kind-usage-meter-breakdown><kind-usage-meter-breakdown-rows><dl></dl></kind-usage-meter-breakdown-rows></kind-usage-meter-content>`;

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

type Slices = ReturnType<UsageMeterApi["slices"]>;

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
 * `<kind-usage-meter used="3.2" limit="5" period="This month">` fills in its parts when it has no children. Set
 * `breakdown` as a property to list what makes up the usage in its details.
 */
export function defineUsageMeter(): void {
  if (customElements.get("kind-usage-meter")) return;
  createParts(usageMeterPrimitive, {
    root: {
      tag: "kind-usage-meter",
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as UsageMeterApi;
        let drawnSlices: Slices | undefined;
        const draw = () => {
          const state = instance.get() as UsageMeterState;
          // The details hold nothing to press, so opening them leaves focus on the trigger, as React's default does.
          const content = el.querySelector("kind-usage-meter-content");
          if (content && !content.hasAttribute("initial-focus"))
            content.setAttribute("initial-focus", "none");
          const meter = el.querySelector<MeterElement>("kind-usage-meter-value ui-meter");
          const { value, max, locale, label, getValueLabel } = api.valueState(state);
          write(meter, "value", value);
          write(meter, "max", max);
          write(meter, "locale", locale);
          write(meter, "getValueLabel", getValueLabel);
          write(meter, "ariaLabel", label);
          const title = el.querySelector("kind-usage-meter-title > h2");
          if (owns(title) && title.textContent !== state.label) title.textContent = state.label;
          const description = el.querySelector("kind-usage-meter-description");
          const countText = api.countText(state);
          if (owns(description) && description.textContent !== countText) description.textContent = countText;
          const slices = api.slices(state);
          if (slices !== drawnSlices) {
            drawnSlices = slices;
            drawSlices(
              el.querySelector("kind-usage-meter-breakdown"),
              el.querySelector("kind-usage-meter-breakdown-rows > dl"),
              slices,
            );
          }
          const period = el.querySelector("kind-usage-meter-period");
          const text = api.periodText(state);
          if (owns(period) && period.textContent !== text) period.textContent = text;
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        return unsubscribe;
      },
    },
    trigger: { tag: "kind-usage-meter-trigger", target: wrappedButton, display: "contents" },
    value: { tag: "kind-usage-meter-value", display: "contents" },
    content: "kind-usage-meter-content",
    title: { tag: "kind-usage-meter-title", target: wrappedChild("h2"), display: "contents" },
    description: "kind-usage-meter-description",
    breakdown: "kind-usage-meter-breakdown",
    "breakdown-rows": {
      tag: "kind-usage-meter-breakdown-rows",
      target: wrappedChild("dl"),
      display: "contents",
    },
    period: "kind-usage-meter-period",
  });
}

export type KindUsageMeterEvents = {
  openchange: UiChangeEvent<boolean, UsageMeterOpenChangeReason>;
};

export interface KindUsageMeterElement
  extends UiElement<KindUsageMeterEvents>,
    AttributeProperties<typeof usageMeterPrimitive, "api" | "open" | "breakdown"> {
  open: boolean;
  breakdown?: UsageMeterOptions["breakdown"];
  api: Pick<UsageMeterApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-usage-meter": KindUsageMeterElement;
    "kind-usage-meter-trigger": HTMLElement;
    "kind-usage-meter-value": HTMLElement;
    "kind-usage-meter-content": HTMLElement;
    "kind-usage-meter-title": HTMLElement;
    "kind-usage-meter-description": HTMLElement;
    "kind-usage-meter-breakdown": HTMLElement;
    "kind-usage-meter-breakdown-rows": HTMLElement;
    "kind-usage-meter-period": HTMLElement;
  }
}
