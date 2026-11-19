import "@ui-sdk/web/resizable";

const classes = [
  "contents",
  "[&_[data-slot=resizable]]:min-h-0",
  "[&_[data-slot=resizable]]:min-w-0",
  "[&_[data-slot=resizable-panel]]:min-h-0",
  "[&_[data-slot=resizable-handle]]:relative",
  "[&_[data-slot=resizable-handle]]:w-px",
  "[&_[data-slot=resizable-handle]]:shrink-0",
  "[&_[data-slot=resizable-handle]]:bg-[var(--kind-color-border)]",
  "[&_[data-slot=resizable-handle]]:outline-hidden",
  "[&_[data-slot=resizable-handle]]:transition-colors",
  "[&_[data-slot=resizable-handle]]:duration-[var(--kind-duration-fast)]",
  "[&_[data-slot=resizable-handle]]:ease-[var(--kind-ease)]",
  "[&_[data-slot=resizable-handle]]:data-[hovering]:bg-[var(--kind-color-ring)]",
  "[&_[data-slot=resizable-handle]]:data-[dragging]:bg-[var(--kind-color-ring)]",
  "[&_[data-slot=resizable-handle]]:focus-visible:bg-[var(--kind-color-ring)]",
  "[&_[data-slot=resizable-handle]]:focus-visible:outline-2",
  "[&_[data-slot=resizable-handle]]:focus-visible:outline-offset-1",
  "[&_[data-slot=resizable-handle]]:focus-visible:outline-[var(--kind-color-ring)]",
  "[&_[data-slot=resizable-handle]]:motion-reduce:transition-none",
  "[&_[data-slot=resizable-handle]]:forced-colors:bg-[CanvasText]",
];

export function defineInternalResizable(): void {
  if (customElements.get("kind-internal-resizable")) return;
  customElements.define(
    "kind-internal-resizable",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-resizable": HTMLElement;
  }
}
