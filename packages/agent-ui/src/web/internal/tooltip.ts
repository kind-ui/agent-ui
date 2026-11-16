import "@ui-sdk/web/tooltip";

const classes = [
  "contents",
  "[&_[data-slot=tooltip-content]]:z-50",
  "[&_[data-slot=tooltip-content]]:rounded-[calc(var(--kind-radius)/2)]",
  "[&_[data-slot=tooltip-content]]:bg-[var(--kind-color-fg)]",
  "[&_[data-slot=tooltip-content]]:px-2",
  "[&_[data-slot=tooltip-content]]:py-1",
  "[&_[data-slot=tooltip-content]]:text-xs",
  "[&_[data-slot=tooltip-content]]:font-medium",
  "[&_[data-slot=tooltip-content]]:text-[var(--kind-color-surface)]",
  "[&_[data-slot=tooltip-content]]:shadow-md",
  "[&_[data-slot=tooltip-content]]:shadow-[color:var(--kind-color-shadow)]/10",
  "[&_[data-slot=tooltip-content]]:[transform-origin:var(--transform-origin)]",
];

export function defineInternalTooltip(): void {
  if (customElements.get("kind-internal-tooltip")) return;
  customElements.define(
    "kind-internal-tooltip",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-tooltip": HTMLElement;
  }
}
