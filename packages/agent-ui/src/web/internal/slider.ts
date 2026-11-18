import "@ui-sdk/web/slider";

const classes = [
  "contents",
  "[&_[data-slot=slider]]:flex",
  "[&_[data-slot=slider]]:w-full",
  "[&_[data-slot=slider]]:flex-col",
  "[&_[data-slot=slider]]:gap-1.5",
  "[&_[data-slot=slider]]:data-disabled:opacity-50",
  "[&_[data-slot=slider-control]]:flex",
  "[&_[data-slot=slider-control]]:h-[var(--kind-slider-control-height,1.25rem)]",
  "[&_[data-slot=slider-control]]:w-full",
  "[&_[data-slot=slider-control]]:touch-none",
  "[&_[data-slot=slider-control]]:select-none",
  "[&_[data-slot=slider-control]]:items-center",
  "[&_[data-slot=slider-control]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=slider-track]]:h-[var(--kind-slider-track-height,0.25rem)]",
  "[&_[data-slot=slider-track]]:w-full",
  "[&_[data-slot=slider-track]]:rounded-[var(--kind-slider-track-radius,9999px)]",
  "[&_[data-slot=slider-track]]:bg-[var(--kind-slider-track-color,var(--kind-color-hover))]",
  "[&_[data-slot=slider-indicator]]:rounded-full",
  "[&_[data-slot=slider-indicator]]:bg-[var(--kind-slider-indicator-color,var(--kind-color-accent))]",
  "[&_[data-slot=slider-thumb]]:size-[var(--kind-slider-thumb-size,1rem)]",
  "[&_[data-slot=slider-thumb]]:rounded-full",
  "[&_[data-slot=slider-thumb]]:border",
  "[&_[data-slot=slider-thumb]]:border-[var(--kind-slider-thumb-border,var(--kind-color-border))]",
  "[&_[data-slot=slider-thumb]]:bg-[var(--kind-slider-thumb-color,var(--kind-color-surface))]",
  "[&_[data-slot=slider-thumb]]:shadow-sm",
  "[&_[data-slot=slider-thumb]]:shadow-[color:var(--kind-color-shadow)]/10",
  "[&_[data-slot=slider-thumb]]:has-[:focus-visible]:outline-2",
  "[&_[data-slot=slider-thumb]]:has-[:focus-visible]:outline-offset-2",
  "[&_[data-slot=slider-thumb]]:has-[:focus-visible]:outline-[var(--kind-color-ring)]",
  "[&_[data-slot=slider-value]]:text-[length:var(--kind-slider-value-font-size,0.75rem)]",
  "[&_[data-slot=slider-value]]:leading-[var(--kind-slider-value-line-height,1rem)]",
  "[&_[data-slot=slider-value]]:tabular-nums",
  "[&_[data-slot=slider-value]]:text-[var(--kind-slider-value-color,var(--kind-color-muted))]",
];

export function defineInternalSlider(): void {
  if (customElements.get("kind-internal-slider")) return;
  customElements.define(
    "kind-internal-slider",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-slider": HTMLElement;
  }
}
