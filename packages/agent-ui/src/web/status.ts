import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type { AttributeProperties, UiElement } from "@ui-sdk/web/events";

/** `<kind-status status="…">` fills in its mark and label when it has no children. */
export function defineStatus(): void {
  if (customElements.get("kind-status")) return;
  createParts(statusPrimitive, {
    root: {
      tag: "kind-status",
      render: (el, instance) => {
        if (!el.firstElementChild)
          el.innerHTML = "<kind-status-icon></kind-status-icon><kind-status-label></kind-status-label>";
        const label = el.querySelector("kind-status-label");
        const draw = () => {
          const text = instance.get().label;
          if (label && label.textContent !== text) label.textContent = text;
        };
        draw();
        return instance.subscribe(draw);
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
