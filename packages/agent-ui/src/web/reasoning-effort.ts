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
const drawn = new WeakMap<Element, ReasoningEffortLevel[]>();

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

/** Draws a level for each one in `levels`, reusing the element of a level with the same value. */
const drawLevels = (control: Element, levels: ReasoningEffortLevel[]) => {
  const items = new Map<string, Element>();
  for (const item of control.querySelectorAll(":scope > ui-segmented-control-item"))
    items.set(item.getAttribute("value") ?? "", item);
  const next = levels.map((level) => {
    const item = items.get(level.value) ?? control.ownerDocument.createElement("ui-segmented-control-item");
    item.setAttribute("value", level.value);
    if (item.textContent !== level.label) item.textContent = level.label;
    items.delete(level.value);
    return item;
  });
  for (const item of items.values()) item.remove();
  control.append(...next);
};

/**
 * `<kind-reasoning-effort>` fills in its levels when it has no children. Set `levels` and `value` as properties;
 * choosing a level fires `valuechange` with its value as `detail.value`.
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
          const { levels, ...props } = api.controlState(state);
          const control = el.querySelector<Element & Record<string, unknown>>("ui-segmented-control");
          if (control) for (const [key, value] of Object.entries(props)) write(control, key, value);
          if (control && owned.has(control) && drawn.get(control) !== levels) {
            drawn.set(control, levels);
            drawLevels(control, levels);
          }
          api.syncValue();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
  });
}

export type KindReasoningEffortEvents = {
  valuechange: UiChangeEvent<string | null, ReasoningEffortValueChangeReason>;
};

export interface KindReasoningEffortElement
  extends UiElement<KindReasoningEffortEvents>,
    AttributeProperties<typeof reasoningEffortPrimitive, "api" | "levels" | "value" | "defaultValue"> {
  levels?: ReasoningEffortOptions["levels"];
  value: string | null;
  defaultValue?: string | null;
  api: Pick<ReasoningEffortApi, "getValue" | "setValue">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-reasoning-effort": KindReasoningEffortElement;
  }
}
