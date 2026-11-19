import { daySeparatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

// Labels this element filled in. A label someone wrote text into keeps it, as React's `DaySeparatorLabel` children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

/**
 * `<kind-day-separator date="…">` fills in its label when it has no children, and writes the day into an empty
 * `<kind-day-separator-label><time>`.
 */
export function defineDaySeparator(): void {
  if (customElements.get("kind-day-separator")) return;
  createParts(daySeparatorPrimitive, {
    root: {
      tag: "kind-day-separator",
      defaults: { relative: true },
      render: (el, instance) => {
        if (!el.firstElementChild)
          el.innerHTML = "<kind-day-separator-label><time></time></kind-day-separator-label>";
        const draw = () => {
          const time = el.querySelector("kind-day-separator-label > time");
          if (!time || (!owned.has(time) && time.textContent)) return;
          owned.add(time);
          const { label } = instance.api.labelState(instance.get());
          if (time.textContent !== label) time.textContent = label;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    label: { tag: "kind-day-separator-label", target: wrappedChild("time"), display: "contents" },
  });
}

export interface KindDaySeparatorElement
  extends UiElement<Record<never, never>>,
    AttributeProperties<typeof daySeparatorPrimitive> {}

declare global {
  interface HTMLElementTagNameMap {
    "kind-day-separator": KindDaySeparatorElement;
    "kind-day-separator-label": HTMLElement;
  }
}
