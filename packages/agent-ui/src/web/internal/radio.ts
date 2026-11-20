import "@ui-sdk/web/radio";

const classes = [
  "contents",
  "[&_[data-slot=radio-group]]:flex",
  "[&_[data-slot=radio-group]]:flex-col",
  "[&_[data-slot=radio-group]]:gap-1",
  "[&_[data-slot=radio]]:relative",
  "[&_[data-slot=radio]]:inline-flex",
  "[&_[data-slot=radio]]:size-4",
  "[&_[data-slot=radio]]:shrink-0",
  "[&_[data-slot=radio]]:items-center",
  "[&_[data-slot=radio]]:justify-center",
  "[&_[data-slot=radio]]:rounded-full",
  "[&_[data-slot=radio]]:border",
  "[&_[data-slot=radio]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=radio]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=radio]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=radio]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=radio]]:data-checked:border-[var(--kind-color-accent)]",
  "[&_[data-slot=radio]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=radio]]:data-disabled:opacity-[var(--kind-disabled-opacity)]",
  "[&_[data-slot=radio-indicator]]:size-2",
  "[&_[data-slot=radio-indicator]]:rounded-full",
  "[&_[data-slot=radio-indicator]]:bg-[var(--kind-color-accent)]",
];

export function defineInternalRadio(): void {
  if (customElements.get("kind-internal-radio")) return;
  customElements.define(
    "kind-internal-radio",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-radio": HTMLElement;
  }
}
