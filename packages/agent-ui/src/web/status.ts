import { stalledText, statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

// Labels this element filled in. A label someone wrote text into keeps it, as React's `StatusLabel` children do.
// Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

/**
 * `<kind-status status="…">` fills in its mark, label and stalled words when it has no children, and writes the label
 * into an empty `<kind-status-label>` and "No update for 5 min" into an empty `<kind-status-stalled>`.
 */
export function defineStatus(): void {
  if (customElements.get("kind-status")) return;
  createParts(statusPrimitive, {
    root: {
      tag: "kind-status",
      render: (el, instance) => {
        if (!el.firstElementChild)
          el.innerHTML =
            "<kind-status-icon></kind-status-icon><kind-status-label></kind-status-label><kind-status-stalled></kind-status-stalled>";
        const fill = (part: Element | null, text: string) => {
          if (!part || (!owned.has(part) && part.textContent)) return;
          owned.add(part);
          if (part.textContent !== text) part.textContent = text;
        };
        const draw = () => {
          const { label, stalledMinutes } = instance.get();
          fill(el.querySelector("kind-status-label"), label);
          fill(el.querySelector("kind-status-stalled"), stalledText(stalledMinutes));
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
    stalled: "kind-status-stalled",
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
    "kind-status-stalled": HTMLElement;
  }
}
