import { thinkingIndicatorPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";

const parts = `<kind-thinking-indicator-label></kind-thinking-indicator-label><kind-thinking-indicator-dots><kind-thinking-indicator-dot></kind-thinking-indicator-dot><kind-thinking-indicator-dot></kind-thinking-indicator-dot><kind-thinking-indicator-dot></kind-thinking-indicator-dot></kind-thinking-indicator-dots>`;

/** `<kind-thinking-indicator label="…">` fills in its label and dots when it has no children. */
export function defineThinkingIndicator(): void {
  if (customElements.get("kind-thinking-indicator")) return;
  createParts(thinkingIndicatorPrimitive, {
    root: {
      tag: "kind-thinking-indicator",
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = parts;
        const label = el.querySelector("kind-thinking-indicator-label");
        const draw = () => {
          const text = instance.get().label;
          if (label && label.textContent !== text) label.textContent = text;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    label: "kind-thinking-indicator-label",
    dots: "kind-thinking-indicator-dots",
    dot: "kind-thinking-indicator-dot",
  });
}
