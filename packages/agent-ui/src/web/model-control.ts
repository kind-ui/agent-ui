import {
  type ModelControlApi,
  type ModelControlChangeReason,
  type ModelControlEffortChangeReason,
  type ModelControlOptions,
  type ModelControlState,
  type ModelControlTriggerState,
  modelControlPrimitive,
  type SettingsMenuChangeReason,
  type SettingsMenuContentState,
} from "@kind-ui/agent-ui/core";
import type { OptionsOf } from "@ui-sdk/core";
import type { MenuOpenChangeReason } from "@ui-sdk/core/menu";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalMenu, menuElement as element } from "./internal/menu.js";
import { drawSettingsRows } from "./settings-menu.js";

const DEFAULT_PARTS = `<kind-internal-menu><ui-menu><kind-model-control-trigger><ui-menu-trigger><button type="button" data-agent-hidden></button></ui-menu-trigger></kind-model-control-trigger><kind-model-control-content><ui-menu-content side-offset="6" align="start"></ui-menu-content></kind-model-control-content></ui-menu></kind-internal-menu>`;

// Buttons and contents this element filled in, and so draws. One someone wrote keeps its own, as React's children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
const drawn = new WeakMap<Element, unknown>();

const icon = (document: Document, value: unknown) => {
  const holder = element(document, "ui-menu-item-icon");
  if (typeof value === "string") holder.append(element(document, "img", { alt: "", src: value }));
  else if (value instanceof Element) holder.append(value.cloneNode(true));
  return holder;
};

/** The model's icon and name, then every effort label in one cell (only the chosen one shown, so the width holds). */
const drawTrigger = (button: Element, { model, effort }: ModelControlTriggerState) => {
  const document = button.ownerDocument;
  const shape = drawn.get(button) as [unknown, unknown] | undefined;
  if (!shape || shape[0] !== model.icon || shape[1] !== effort?.options) {
    drawn.set(button, [model.icon, effort?.options]);
    const parts: (Node | string)[] = [];
    if (model.icon !== undefined) parts.push(icon(document, model.icon));
    parts.push(element(document, "span", { "data-model-control-model": "" }));
    if (effort) {
      const value = element(document, "span", { "data-model-control-effort": "" });
      value.append(...effort.options.map((option) => element(document, "span", {}, option.label)));
      // Spaces around the "·", so the accessible name reads "GPT-5 · High"; the trigger's gap spaces it on screen.
      parts.push(" ", element(document, "span", { "data-model-control-separator": "" }, "·"), " ", value);
    }
    parts.push(element(document, "span", { "data-menu-chevron": "" }));
    button.replaceChildren(...parts);
  }
  const name = button.querySelector("[data-model-control-model]");
  if (name && name.textContent !== model.label) name.textContent = model.label;
  const labels = button.querySelector("[data-model-control-effort]")?.children ?? [];
  for (const [index, label] of [...labels].entries())
    label.toggleAttribute("data-current", effort?.options[index]?.value === effort?.value);
};

/** The element a Model Control's root is: its `can-run` attribute, read into the options. */
type ModelControlRootElement = HTMLElement & { canRun?: boolean };

/**
 * `<kind-model-control>` fills in its trigger and menu when it has no children. Set `models`, `levels`, `actions` and
 * `settings` as properties; choosing a model fires `modelchange`, an effort `effortchange`, another setting
 * `valueschange`, and with `can-run`, an action fires `modelaction` with its `id`.
 */
export function defineModelControl(): void {
  if (customElements.get("kind-model-control")) return;
  defineInternalMenu();
  createParts(modelControlPrimitive, {
    root: {
      tag: "kind-model-control",
      kinds: { canRun: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) =>
        ((el as ModelControlRootElement).canRun ? {} : { onAction: undefined }) as Partial<
          OptionsOf<typeof modelControlPrimitive>
        >,
      state: {
        open: { get: (api) => api.isOpen(), set: (api, open) => api.setOpen(!!open) },
        model: { get: (api) => api.getModel(), set: (api, model) => api.setModel?.(String(model)) },
        effort: { get: (api) => api.getEffort(), set: (api, effort) => api.setEffort?.(String(effort)) },
        values: {
          get: (api) => api.getValues(),
          set: (api, values) => api.setValues((values ?? {}) as Record<string, boolean | string>),
        },
      },
      events: {
        onModelChange: "modelchange",
        onEffortChange: "effortchange",
        onAction: "modelaction",
      },
      api: ["isOpen", "setOpen", "getModel", "getEffort", "getValues", "setValues"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as ModelControlApi;
        const draw = () => {
          const state = instance.get() as ModelControlState;
          const { controller, presentation, open } = api.partState.menu(state);
          const menu = el.querySelector("ui-menu");
          if (menu) {
            if (menu.controller !== controller) menu.controller = controller;
            if (menu.presentation !== presentation) menu.presentation = presentation;
            if (menu.open !== open) menu.open = open;
          }
          const trigger = el.querySelector("kind-model-control-trigger > ui-menu-trigger");
          const props = api.triggerState(state);
          trigger?.toggleAttribute("disabled", props.disabled);
          const button = trigger?.querySelector("button");
          if (button && button.ariaLabel !== props["aria-label"]) button.ariaLabel = props["aria-label"];
          // A button written empty fills itself in, as React's bare `ModelControlTrigger` does.
          if (button && !button.firstChild) owned.add(button);
          if (button && owned.has(button)) drawTrigger(button, props);
          const content = el.querySelector("kind-model-control-content > ui-menu-content");
          const rows: SettingsMenuContentState = api.contentState(state);
          if (content && !content.firstChild) owned.add(content);
          if (content && owned.has(content) && drawn.get(content) !== rows) {
            drawn.set(content, rows);
            drawSettingsRows(content, rows.rows);
          }
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-model-control-trigger", display: "contents" },
    content: { tag: "kind-model-control-content", display: "contents" },
  });
}

export type KindModelControlEvents = {
  modelchange: UiChangeEvent<string, ModelControlChangeReason>;
  effortchange: UiChangeEvent<string, ModelControlEffortChangeReason>;
  valueschange: UiChangeEvent<Record<string, boolean | string>, SettingsMenuChangeReason> & {
    detail: { id: string };
  };
  modelaction: UiChangeEvent<string, ModelControlChangeReason>;
  openchange: UiChangeEvent<boolean, MenuOpenChangeReason>;
};

type Icon = string | Element;

export interface KindModelControlElement
  extends UiElement<KindModelControlEvents>,
    AttributeProperties<
      typeof modelControlPrimitive,
      "api" | "models" | "levels" | "actions" | "settings" | "model" | "effort" | "values" | "open"
    > {
  /**
   * A model's `icon` is an image URL, or an element (such as an `svg`) copied into its row and the trigger. A copy
   * keeps the element's ids, so pass a logo that uses `defs` (gradients, masks) as an image URL.
   */
  models?: (Omit<NonNullable<ModelControlOptions["models"]>[number], "icon"> & { icon?: Icon })[];
  levels?: ModelControlOptions["levels"];
  actions?: (Omit<NonNullable<ModelControlOptions["actions"]>[number], "icon"> & { icon?: Icon })[];
  /** More rows: toggles above Model and Effort, choices below. */
  settings?: (NonNullable<ModelControlOptions["settings"]>[number] & { icon?: Icon })[];
  /** The chosen model's `id`. Setting it chooses one and fires no event, as a native `value` does. */
  get model(): string | null;
  set model(id: string);
  /** The effort level the chosen model uses. Setting it chooses one and fires no event, as a native `value` does. */
  get effort(): string | null;
  set effort(level: string);
  /** The other settings' values by `id`. Setting it changes each that differs and fires no event. */
  values: Record<string, boolean | string>;
  defaultValues?: Record<string, boolean | string>;
  open: boolean;
  /** Whether a person can run the `actions`, which fires `modelaction`. */
  canRun: boolean;
  api: Pick<ModelControlApi, "isOpen" | "setOpen" | "getModel" | "getEffort" | "getValues" | "setValues">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-model-control": KindModelControlElement;
    "kind-model-control-trigger": HTMLElement;
    "kind-model-control-content": HTMLElement;
  }
}
