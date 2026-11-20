import "@ui-sdk/web/collapsible";

const classes = [
  "contents",
  "[&_[data-slot=collapsible]]:flex",
  "[&_[data-slot=collapsible]]:flex-col",
  "[&_[data-slot=collapsible]]:gap-1",
  "[&_[data-slot=collapsible-trigger]]:inline-flex",
  "[&_[data-slot=collapsible-trigger]]:items-center",
  "[&_[data-slot=collapsible-trigger]]:gap-1.5",
  "[&_[data-slot=collapsible-trigger]]:self-start",
  "[&_[data-slot=collapsible-trigger]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=collapsible-trigger]]:px-2",
  "[&_[data-slot=collapsible-trigger]]:py-1",
  "[&_[data-slot=collapsible-trigger]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=collapsible-trigger]]:font-medium",
  "[&_[data-slot=collapsible-trigger]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=collapsible-trigger]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=collapsible-trigger]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=collapsible-trigger]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=collapsible-trigger]]:data-disabled:opacity-[var(--kind-disabled-opacity)]",
  "[&_[data-slot=collapsible-panel]]:overflow-hidden",
  "[&_[data-slot=collapsible-panel]]:px-2",
  "[&_[data-slot=collapsible-panel]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=collapsible-panel]]:text-[var(--kind-color-fg)]",
];

export function defineInternalCollapsible(): void {
  if (customElements.get("kind-internal-collapsible")) return;
  customElements.define(
    "kind-internal-collapsible",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-collapsible": HTMLElement;
  }
}
