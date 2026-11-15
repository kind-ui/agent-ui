import "@ui-sdk/web/progress";

const classes = [
  "contents",
  "[&_[data-slot=progress]]:flex",
  "[&_[data-slot=progress]]:flex-col",
  "[&_[data-slot=progress]]:gap-1",
  "[&_[data-slot=progress]]:text-sm",
  "[&_[data-slot=progress-label]]:font-medium",
  "[&_[data-slot=progress-label]]:text-neutral-900",
  "[&_[data-slot=progress-value]]:tabular-nums",
  "[&_[data-slot=progress-value]]:text-neutral-600",
  "[&_[data-slot=progress-track]]:h-1.5",
  "[&_[data-slot=progress-track]]:w-full",
  "[&_[data-slot=progress-track]]:overflow-hidden",
  "[&_[data-slot=progress-track]]:rounded-full",
  "[&_[data-slot=progress-track]]:bg-neutral-200",
  "[&_[data-slot=progress-indicator]]:h-full",
  "[&_[data-slot=progress-indicator]]:bg-neutral-900",
  "[&_[data-slot=progress-indicator]]:data-indeterminate:w-1/3",
];

export function defineInternalProgress(): void {
  if (customElements.get("kind-internal-progress")) return;
  customElements.define(
    "kind-internal-progress",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
