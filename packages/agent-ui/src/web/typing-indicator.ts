import { indicatorLabel, typingIndicatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

const parts = `<kind-typing-indicator-label></kind-typing-indicator-label><kind-typing-indicator-dots><kind-typing-indicator-dot></kind-typing-indicator-dot><kind-typing-indicator-dot></kind-typing-indicator-dot><kind-typing-indicator-dot></kind-typing-indicator-dot></kind-typing-indicator-dots>`;

/** `<kind-typing-indicator label="…">` fills in its label and dots when it has no children. */
export function defineTypingIndicator(): void {
  if (customElements.get("kind-typing-indicator")) return;
  createParts(typingIndicatorPrimitive, {
    root: {
      tag: "kind-typing-indicator",
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = parts;
        const label = el.querySelector("kind-typing-indicator-label");
        const draw = () => {
          const text = indicatorLabel(instance.get());
          if (label && label.textContent !== text) label.textContent = text;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    label: "kind-typing-indicator-label",
    dots: "kind-typing-indicator-dots",
    dot: "kind-typing-indicator-dot",
  });
}

export interface KindTypingIndicatorElement
  extends UiElement<Record<never, never>>,
    AttributeProperties<typeof typingIndicatorPrimitive> {}

declare global {
  interface HTMLElementTagNameMap {
    "kind-typing-indicator": KindTypingIndicatorElement;
    "kind-typing-indicator-label": HTMLElement;
    "kind-typing-indicator-dots": HTMLElement;
    "kind-typing-indicator-dot": HTMLElement;
  }
}
