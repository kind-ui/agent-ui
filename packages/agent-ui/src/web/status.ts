import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

/**
 * `<kind-status status="…">` fills in its mark and label when it has no children, and writes the label into an empty
 * `<kind-status-label>`.
 */
export function defineStatus(): void {
  if (customElements.get("kind-status")) return;
  createParts(statusPrimitive, {
    root: {
      tag: "kind-status",
      render: (el, instance) => {
        if (!el.firstElementChild)
          el.innerHTML = "<kind-status-icon></kind-status-icon><kind-status-label></kind-status-label>";
        // A label someone wrote text into keeps it, as React's `StatusLabel` children do.
        const owned = new WeakSet<Element>();
        const draw = () => {
          const label = el.querySelector("kind-status-label");
          if (!label || (!owned.has(label) && label.textContent)) return;
          owned.add(label);
          const text = instance.get().label;
          if (label.textContent !== text) label.textContent = text;
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          if (records.some((record) => [...record.addedNodes].some((node) => node instanceof Element)))
            draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    icon: "kind-status-icon",
    label: "kind-status-label",
  });
}

export interface KindStatusElement
  extends UiElement<Record<never, never>>,
    AttributeProperties<typeof statusPrimitive> {}

declare global {
  interface HTMLElementTagNameMap {
    "kind-status": KindStatusElement;
    "kind-status-icon": HTMLElement;
    "kind-status-label": HTMLElement;
  }
}
