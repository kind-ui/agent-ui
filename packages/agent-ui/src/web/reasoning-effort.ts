import {
  type ReasoningEffortApi,
  type ReasoningEffortLevel,
  type ReasoningEffortOptions,
  type ReasoningEffortState,
  type ReasoningEffortValueChangeReason,
  reasoningEffortPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalSegmentedControl } from "./internal/segmented-control.js";

const DEFAULT_PARTS = `<kind-internal-segmented-control><ui-segmented-control data-agent-hidden><ui-segmented-control-indicator></ui-segmented-control-indicator></ui-segmented-control></kind-internal-segmented-control>`;

// Controls this element filled in, and so draws the levels of. A control someone wrote keeps its items, as React's
// children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();
type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

/**
 * Draws a level for each one in `levels`, reusing the element of a level with the same value and moving only what is
 * out of place, so a focused level keeps focus. `moveBefore` doesn't take focus away, where the browser has it.
 */
const drawLevels = (control: Movable, levels: ReasoningEffortLevel[]) => {
  const items = new Map<string, Element>();
  for (const item of control.querySelectorAll(":scope > ui-segmented-control-item"))
    items.set(item.getAttribute("value") ?? "", item);
  let previous = control.querySelector(":scope > ui-segmented-control-indicator");
  for (const level of levels) {
    const item = items.get(level.value) ?? control.ownerDocument.createElement("ui-segmented-control-item");
    items.delete(level.value);
    if (item.getAttribute("value") !== level.value) item.setAttribute("value", level.value);
    if (item.textContent !== level.label) item.textContent = level.label;
    const before = previous ? previous.nextElementSibling : control.firstElementChild;
    if (before !== item) {
      if (control.moveBefore && item.isConnected) control.moveBefore(item, before);
      else control.insertBefore(item, before);
    }
    previous = item;
  }
  for (const item of items.values()) item.remove();
};

/**
 * `<kind-reasoning-effort>` fills in its levels when it has no children. Set `levels` and `value` as properties;
 * choosing a level fires `effortchange` with its value as `detail.value`.
 */
export function defineReasoningEffort(): void {
  if (customElements.get("kind-reasoning-effort")) return;
  defineInternalSegmentedControl();
  createParts(reasoningEffortPrimitive, {
    root: {
      tag: "kind-reasoning-effort",
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => api.setValue(String(value)),
        },
      },
      // The inner Segmented Control fires a `valuechange` of its own, which a capture listener would hear first.
      events: { onValueChange: "effortchange" },
      api: ["getValue", "setValue"],
      render: (el, instance) => {
        if (!el.firstElementChild) {
          el.innerHTML = DEFAULT_PARTS;
          const control = el.querySelector("ui-segmented-control");
          if (control) owned.add(control);
        }
        const api = instance.api as ReasoningEffortApi;
        const draw = () => {
          const state = instance.get() as ReasoningEffortState;
          const { levels, "aria-label": ariaLabel, ...props } = api.controlState(state);
          const control = el.querySelector<Element & Record<string, unknown>>("ui-segmented-control");
          if (control)
            for (const [key, value] of Object.entries({ ...props, ariaLabel })) write(control, key, value);
          if (control && owned.has(control)) drawLevels(control, levels);
          api.syncValue();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
  });
}

export type KindReasoningEffortEvents = {
  effortchange: UiChangeEvent<string | null, ReasoningEffortValueChangeReason>;
};

export interface KindReasoningEffortElement
  extends UiElement<KindReasoningEffortEvents>,
    AttributeProperties<typeof reasoningEffortPrimitive, "api" | "levels" | "value" | "defaultValue"> {
  levels?: ReasoningEffortOptions["levels"];
  get value(): string | null;
  set value(value: string);
  defaultValue?: string | null;
  api: Pick<ReasoningEffortApi, "getValue" | "setValue">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-reasoning-effort": KindReasoningEffortElement;
  }
}
