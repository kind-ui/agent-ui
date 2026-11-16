import "@ui-sdk/web/toggle";

const classes = [
  "contents",
  "[&_[data-slot=toggle]]:inline-flex",
  "[&_[data-slot=toggle]]:h-8",
  "[&_[data-slot=toggle]]:items-center",
  "[&_[data-slot=toggle]]:justify-center",
  "[&_[data-slot=toggle]]:gap-1.5",
  "[&_[data-slot=toggle]]:rounded-[calc(var(--kind-radius)/2)]",
  "[&_[data-slot=toggle]]:px-2",
  "[&_[data-slot=toggle]]:text-sm",
  "[&_[data-slot=toggle]]:font-medium",
  "[&_[data-slot=toggle]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=toggle]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=toggle]]:focus-visible:outline-2",
  "[&_[data-slot=toggle]]:focus-visible:outline-offset-2",
  "[&_[data-slot=toggle]]:focus-visible:outline-[var(--kind-color-ring)]",
  "[&_[data-slot=toggle]]:data-pressed:bg-[var(--kind-color-fg)]",
  "[&_[data-slot=toggle]]:data-pressed:text-[var(--kind-color-surface)]",
  "[&_[data-slot=toggle]]:data-disabled:opacity-50",
  "[&_[data-slot=toggle-icon]]:inline-flex",
  "[&_[data-slot=toggle-icon]]:size-4",
  "[&_[data-slot=toggle-icon]]:shrink-0",
];

export function defineInternalToggle(): void {
  if (customElements.get("kind-internal-toggle")) return;
  customElements.define(
    "kind-internal-toggle",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
