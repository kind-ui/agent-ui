import {
  EFFORT_SLIDER_THUMB,
  type EffortSliderApi,
  type EffortSliderModelState,
  type EffortSliderOptions,
  type EffortSliderState,
  type EffortSliderStop,
  type EffortSliderValueChangeReason,
  effortSliderPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalSlider } from "./internal/slider.js";

// The Slider reads `default-value` as it connects, which it does as this markup is written.
const defaultParts = (defaultValue: number) =>
  `<kind-effort-slider-trigger><button></button></kind-effort-slider-trigger><kind-effort-slider-content hidden><kind-effort-slider-slider><kind-internal-slider><ui-slider default-value="${defaultValue}"><div data-effort-slider-header=""><span data-effort-slider-glyph=""></span><div data-effort-slider-heading=""><kind-effort-slider-title><h2></h2></kind-effort-slider-title><ui-slider-value></ui-slider-value><kind-effort-slider-model><p></p></kind-effort-slider-model></div><kind-effort-slider-reset><button><span data-effort-slider-reset-text="">Reset</span></button></kind-effort-slider-reset></div><ui-slider-control><ui-slider-track><kind-effort-slider-stops></kind-effort-slider-stops><ui-slider-indicator></ui-slider-indicator><ui-slider-thumb></ui-slider-thumb></ui-slider-track></ui-slider-control></ui-slider></kind-internal-slider></kind-effort-slider-slider></kind-effort-slider-content>`;

// Parts this element filled in, and so writes. A part someone wrote keeps its own, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
// Each element's instance, which the content's portal reads to tell how it presents.
const instances = new WeakMap<Element, { get: () => unknown }>();
// The full-screen element each slider's sheet sits in, made the first time it presents as one.
const viewports = new WeakMap<Element, Element>();
// What each part was last drawn from, so a redraw for another part's change leaves it alone.
const drawn = new WeakMap<Element, unknown>();

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

const element = (document: Document, tag: string, attributes: Record<string, string> = {}, text?: string) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  if (text !== undefined) el.textContent = text;
  return el;
};

/** The flame, every level's label in one cell (only the chosen one shown, so the width holds), then the chevron. */
const drawTrigger = (button: Element, levels: EffortSliderState["levels"], index: number) => {
  const document = button.ownerDocument;
  if (drawn.get(button) !== levels) {
    drawn.set(button, levels);
    const value = element(document, "span", { "data-effort-slider-value": "" });
    value.append(...levels.map((level) => element(document, "span", {}, level.label)));
    button.replaceChildren(
      element(document, "span", { "data-effort-slider-glyph": "" }),
      value,
      element(document, "span", { "data-effort-slider-chevron": "" }),
    );
  }
  for (const [at, span] of [
    ...(button.querySelector("[data-effort-slider-value]")?.children ?? []),
  ].entries())
    span.toggleAttribute("data-current", at === index);
};

const sameStop = (a: EffortSliderStop | undefined, b: EffortSliderStop) =>
  a?.value === b.value && a.label === b.label && a.position === b.position && a.top === b.top;

/** A dot for each stop, built again only when the levels change. */
const drawStops = (part: Element, stops: EffortSliderStop[]) => {
  const previous = drawn.get(part) as EffortSliderStop[] | undefined;
  if (previous === stops) return;
  drawn.set(part, stops);
  const document = part.ownerDocument;
  if (previous?.length !== stops.length || !stops.every((stop, at) => sameStop(previous[at], stop)))
    part.replaceChildren(
      ...stops.map((stop) => {
        const span = element(document, "span", { "data-effort-slider-stop": "" });
        span.toggleAttribute("data-top", stop.top);
        span.style.setProperty("--kind-effort-slider-stop", String(stop.position));
        return span;
      }),
    );
  for (const [at, span] of [...part.children].entries())
    span.toggleAttribute("data-current", stops[at]?.current ?? false);
};

/** "Effort for GPT-5": a link with an `href`, a button when pressable, else text. */
const drawModel = (part: Element, { text, href, pressable }: EffortSliderModelState) => {
  const document = part.ownerDocument;
  if (href) part.replaceChildren(element(document, "a", { href }, text));
  else if (pressable) part.replaceChildren(element(document, "button", { type: "button" }, text));
  else part.replaceChildren(text);
};

type SliderElement = HTMLElement & Record<string, unknown>;

/**
 * `<kind-effort-slider>` fills in its trigger and popup when it has no children. Set `levels` and `value` as
 * properties; settling on a level fires `effortchange` with its `value` as `detail.value`, and with
 * `can-press-model`, pressing the model line fires `modelpress` with the `model-label`.
 */
export function defineEffortSlider(): void {
  if (customElements.get("kind-effort-slider")) return;
  defineInternalSlider();
  createParts(effortSliderPrimitive, {
    root: {
      tag: "kind-effort-slider",
      kinds: { canPressModel: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) =>
        (el as HTMLElement & { canPressModel?: boolean }).canPressModel ? {} : { onModelPress: undefined },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue?.(String(value)),
        },
      },
      events: { onValueChange: "effortchange", onModelPress: "modelpress" },
      // `setValue` and `reset` are offered only while available, so they aren't copied onto `api`.
      api: ["isOpen", "setOpen", "getValue", "getLevels"],
      // A sheet sits in a full-screen viewport, which the content moves into while it presents as one.
      portal: {
        slots: ["content"],
        container: (el) => {
          if ((instances.get(el)?.get() as EffortSliderState | undefined)?.presentation !== "sheet")
            return null;
          let viewport = viewports.get(el);
          if (!viewport) {
            const created = el.ownerDocument.createElement("kind-effort-slider-viewport");
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
        const api = instance.api as EffortSliderApi;
        if (!el.firstElementChild) {
          el.innerHTML = defaultParts(
            api.sliderState(instance.get() as EffortSliderState).props.defaultValue,
          );
        }
        // As React's `EffortSliderContent` places it, unless the author wrote their own.
        const content = el.querySelector("kind-effort-slider-content");
        for (const [name, value] of [
          ["initial-focus", EFFORT_SLIDER_THUMB],
          ["side", "top"],
          ["side-offset", "8"],
        ] as const)
          if (content && !content.hasAttribute(name)) content.setAttribute(name, value);
        const draw = () => {
          const state = instance.get() as EffortSliderState;
          const button = el.querySelector("kind-effort-slider-trigger > button");
          if (owns(button)) {
            const { levels, index } = api.triggerState(state);
            drawTrigger(button, levels, index);
          }
          const title = el.querySelector("kind-effort-slider-title > h2");
          if (owns(title) && title.textContent !== state.label) title.textContent = state.label;
          const { props, thumbLabel } = api.sliderState(state);
          const slider = el.querySelector<SliderElement>("kind-effort-slider-slider ui-slider");
          // `onValueCommit` stays out: the slider part hears `valuecommit` itself.
          for (const key of ["controller", "min", "max", "step", "format", "disabled"] as const)
            write(slider, key, props[key]);
          // The thumb moves its `aria-label` onto its input, so the label last written is kept here.
          const thumb = el.querySelector("kind-effort-slider-slider ui-slider-thumb");
          if (thumb && drawn.get(thumb) !== thumbLabel) {
            drawn.set(thumb, thumbLabel);
            thumb.ariaLabel = thumbLabel;
          }
          api.syncValue();
          const stops = el.querySelector("kind-effort-slider-stops");
          if (owns(stops)) drawStops(stops, api.stopsState(state).stops);
          const model = el.querySelector("kind-effort-slider-model > p");
          const modelState = api.modelState(state);
          if (owns(model) && drawn.get(model) !== modelState) {
            drawn.set(model, modelState);
            drawModel(model, modelState);
          }
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        return unsubscribe;
      },
    },
    trigger: { tag: "kind-effort-slider-trigger", target: wrappedButton, display: "contents" },
    content: "kind-effort-slider-content",
    viewport: "kind-effort-slider-viewport",
    title: { tag: "kind-effort-slider-title", target: wrappedChild("h2"), display: "contents" },
    slider: { tag: "kind-effort-slider-slider", display: "contents" },
    stops: "kind-effort-slider-stops",
    reset: { tag: "kind-effort-slider-reset", target: wrappedButton, display: "contents" },
    model: { tag: "kind-effort-slider-model", target: wrappedChild("p"), display: "contents" },
  });
}

type OpenChangeReason = Parameters<NonNullable<EffortSliderOptions["onOpenChange"]>>[1]["reason"];

export type KindEffortSliderEvents = {
  effortchange: UiChangeEvent<string, EffortSliderValueChangeReason>;
  modelpress: UiChangeEvent<string, "model-press">;
  openchange: UiChangeEvent<boolean, OpenChangeReason>;
};

export interface KindEffortSliderElement
  extends UiElement<KindEffortSliderEvents>,
    AttributeProperties<typeof effortSliderPrimitive, "api" | "levels" | "value" | "defaultValue" | "open"> {
  levels?: EffortSliderOptions["levels"];
  get value(): string;
  set value(value: string);
  defaultValue?: string;
  open: boolean;
  /** Whether pressing the model line fires `modelpress`, which makes it a button. */
  canPressModel: boolean;
  api: Pick<EffortSliderApi, "isOpen" | "setOpen" | "getValue" | "getLevels">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-effort-slider": KindEffortSliderElement;
    "kind-effort-slider-trigger": HTMLElement;
    "kind-effort-slider-content": HTMLElement;
    "kind-effort-slider-viewport": HTMLElement;
    "kind-effort-slider-title": HTMLElement;
    "kind-effort-slider-slider": HTMLElement;
    "kind-effort-slider-stops": HTMLElement;
    "kind-effort-slider-reset": HTMLElement;
    "kind-effort-slider-model": HTMLElement;
  }
}
