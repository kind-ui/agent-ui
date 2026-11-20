import "@ui-sdk/web/segmented-control";

const classes = [
  "contents",
  "[&_[data-slot=segmented-control]]:relative",
  "[&_[data-slot=segmented-control]]:isolate",
  "[&_[data-slot=segmented-control]]:inline-flex",
  "[&_[data-slot=segmented-control]]:items-center",
  "[&_[data-slot=segmented-control]]:gap-0.5",
  "[&_[data-slot=segmented-control]]:rounded-[var(--kind-radius-full)]",
  "[&_[data-slot=segmented-control]]:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=segmented-control]]:p-0.5",
  "[&_[data-slot=segmented-control]]:data-disabled:opacity-50",
  "[&_[data-slot=segmented-control-indicator]]:absolute",
  "[&_[data-slot=segmented-control-indicator]]:-z-10",
  "[&_[data-slot=segmented-control-indicator]]:top-0",
  "[&_[data-slot=segmented-control-indicator]]:left-0",
  "[&_[data-slot=segmented-control-indicator]]:[translate:var(--segmented-control-indicator-left)_var(--segmented-control-indicator-top)]",
  "[&_[data-slot=segmented-control-indicator]]:h-[var(--segmented-control-indicator-height)]",
  "[&_[data-slot=segmented-control-indicator]]:w-[var(--segmented-control-indicator-width)]",
  "[&_[data-slot=segmented-control-indicator]]:rounded-[var(--kind-radius-full)]",
  "[&_[data-slot=segmented-control-indicator]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=segmented-control-indicator]]:shadow-[0_0_0_1px_var(--kind-color-hairline),var(--kind-shadow-control)]",
  "[&_[data-slot=segmented-control-item]]:inline-flex",
  "[&_[data-slot=segmented-control-item]]:h-7",
  "[&_[data-slot=segmented-control-item]]:items-center",
  "[&_[data-slot=segmented-control-item]]:justify-center",
  "[&_[data-slot=segmented-control-item]]:rounded-[var(--kind-radius-full)]",
  "[&_[data-slot=segmented-control-item]]:px-3",
  "[&_[data-slot=segmented-control-item]]:text-[length:var(--kind-text-xs)]/4",
  "[&_[data-slot=segmented-control-item]]:font-medium",
  "[&_[data-slot=segmented-control-item]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=segmented-control-item]]:outline-hidden",
  "[&_[data-slot=segmented-control-item]]:hover:text-[var(--kind-color-fg)]",
  "[&_[data-slot=segmented-control-item]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=segmented-control-item]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=segmented-control-item]]:data-checked:text-[var(--kind-color-fg)]",
  "[&_[data-slot=segmented-control-item]]:data-disabled:cursor-not-allowed",
];

export function defineInternalSegmentedControl(): void {
  if (customElements.get("kind-internal-segmented-control")) return;
  customElements.define(
    "kind-internal-segmented-control",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-segmented-control": HTMLElement;
  }
}
