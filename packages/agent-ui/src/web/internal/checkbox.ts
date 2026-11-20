import "@ui-sdk/web/checkbox";

const classes = [
  "contents",
  "[&_[data-slot=checkbox-group]]:flex",
  "[&_[data-slot=checkbox-group]]:flex-col",
  "[&_[data-slot=checkbox-group]]:gap-1",
  "[&_[data-slot=checkbox]]:relative",
  "[&_[data-slot=checkbox]]:inline-flex",
  "[&_[data-slot=checkbox]]:size-4",
  "[&_[data-slot=checkbox]]:shrink-0",
  "[&_[data-slot=checkbox]]:items-center",
  "[&_[data-slot=checkbox]]:justify-center",
  "[&_[data-slot=checkbox]]:rounded-[var(--kind-radius-sm)]",
  "[&_[data-slot=checkbox]]:border",
  "[&_[data-slot=checkbox]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=checkbox]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=checkbox]]:text-[var(--kind-color-on-accent)]",
  "[&_[data-slot=checkbox]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=checkbox]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=checkbox]]:data-checked:border-[var(--kind-color-accent)]",
  "[&_[data-slot=checkbox]]:data-checked:bg-[var(--kind-color-accent)]",
  "[&_[data-slot=checkbox]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=checkbox]]:data-disabled:opacity-[var(--kind-disabled-opacity)]",
  "[&_[data-slot=checkbox-indicator]]:flex",
  "[&_[data-slot=checkbox-indicator]]:size-3",
  "[&_[data-slot=checkbox-indicator]]:items-center",
  "[&_[data-slot=checkbox-indicator]]:justify-center",
  "[&_[data-slot=checkbox-indicator]]:[&_svg]:size-full",
];

export function defineInternalCheckbox(): void {
  if (customElements.get("kind-internal-checkbox")) return;
  customElements.define(
    "kind-internal-checkbox",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-checkbox": HTMLElement;
  }
}
