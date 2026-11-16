import { loaderPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";

const parts = `<kind-loader-dots><kind-loader-dot></kind-loader-dot><kind-loader-dot></kind-loader-dot><kind-loader-dot></kind-loader-dot></kind-loader-dots><kind-loader-label></kind-loader-label>`;

/** `<kind-loader label="…">` fills in its label and dots when it has no children. */
export function defineLoader(): void {
  if (customElements.get("kind-loader")) return;
  createParts(loaderPrimitive, {
    root: {
      tag: "kind-loader",
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = parts;
        const label = el.querySelector("kind-loader-label");
        const draw = () => {
          const text = instance.get().label;
          if (label && label.textContent !== text) label.textContent = text;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    label: "kind-loader-label",
    dots: "kind-loader-dots",
    dot: "kind-loader-dot",
  });
}
