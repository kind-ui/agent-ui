import "@ui-sdk/web/combobox";

const classes = [
  "contents",
  "[&_[data-slot=combobox-input]]:h-8",
  "[&_[data-slot=combobox-input]]:min-w-0",
  "[&_[data-slot=combobox-input]]:flex-1",
  "[&_[data-slot=combobox-input]]:bg-transparent",
  "[&_[data-slot=combobox-input]]:px-2",
  "[&_[data-slot=combobox-input]]:text-sm",
  "[&_[data-slot=combobox-input]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=combobox-input]]:outline-none",
  "[&_[data-slot=combobox-input]]:placeholder:text-[var(--kind-color-muted)]",
  "[&_[data-slot=combobox-input]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=combobox-trigger]]:inline-flex",
  "[&_[data-slot=combobox-trigger]]:size-6",
  "[&_[data-slot=combobox-trigger]]:shrink-0",
  "[&_[data-slot=combobox-trigger]]:items-center",
  "[&_[data-slot=combobox-trigger]]:justify-center",
  "[&_[data-slot=combobox-trigger]]:rounded-[calc(var(--kind-radius)/3)]",
  "[&_[data-slot=combobox-trigger]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=combobox-trigger]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=combobox-trigger]]:hover:text-[var(--kind-color-fg)]",
  "[&_[data-slot=combobox-trigger]]:data-disabled:pointer-events-none",
  "[&_[data-slot=combobox-content]]:z-50",
  "[&_[data-slot=combobox-content]]:min-w-[var(--anchor-width)]",
  "[&_[data-slot=combobox-content]]:rounded-[calc(var(--kind-radius)/2)]",
  "[&_[data-slot=combobox-content]]:border",
  "[&_[data-slot=combobox-content]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=combobox-content]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=combobox-content]]:p-1",
  "[&_[data-slot=combobox-content]]:text-sm",
  "[&_[data-slot=combobox-content]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=combobox-content]]:shadow-md",
  "[&_[data-slot=combobox-content]]:shadow-[color:var(--kind-color-shadow)]/10",
  "[&_[data-slot=combobox-content]]:outline-none",
  "[&_[data-slot=combobox-content]]:[--list-height:var(--available-height)]",
  "[&_[data-slot=combobox-content]]:[transform-origin:var(--transform-origin)]",
  "[&_[data-slot=combobox-list]]:max-h-[min(20rem,var(--list-height))]",
  "[&_[data-slot=combobox-list]]:overflow-y-auto",
  "[&_[data-slot=combobox-list]]:overscroll-contain",
  "[&_[data-slot=combobox-list]]:outline-none",
  "[&_[data-slot=combobox-group]]:py-0.5",
  "[&_[data-slot=combobox-group-label]]:px-2",
  "[&_[data-slot=combobox-group-label]]:pt-1.5",
  "[&_[data-slot=combobox-group-label]]:pb-1",
  "[&_[data-slot=combobox-group-label]]:text-xs",
  "[&_[data-slot=combobox-group-label]]:font-medium",
  "[&_[data-slot=combobox-group-label]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=combobox-item]]:flex",
  "[&_[data-slot=combobox-item]]:cursor-default",
  "[&_[data-slot=combobox-item]]:select-none",
  "[&_[data-slot=combobox-item]]:items-center",
  "[&_[data-slot=combobox-item]]:gap-2",
  "[&_[data-slot=combobox-item]]:rounded-[calc(var(--kind-radius)/3)]",
  "[&_[data-slot=combobox-item]]:px-2",
  "[&_[data-slot=combobox-item]]:py-1.5",
  "[&_[data-slot=combobox-item]]:outline-none",
  "[&_[data-slot=combobox-item]]:data-highlighted:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=combobox-item]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=combobox-item]]:data-disabled:opacity-50",
  "[&_[data-slot=combobox-item-indicator]]:ms-auto",
  "[&_[data-slot=combobox-item-indicator]]:inline-flex",
  "[&_[data-slot=combobox-item-indicator]]:size-4",
  "[&_[data-slot=combobox-item-indicator]]:shrink-0",
  "[&_[data-slot=combobox-item-indicator]]:items-center",
  "[&_[data-slot=combobox-item-indicator]]:justify-center",
  "[&_[data-slot=combobox-item-indicator]]:text-[var(--kind-color-accent)]",
  "[&_[data-slot=combobox-empty]]:px-2",
  "[&_[data-slot=combobox-empty]]:text-center",
  "[&_[data-slot=combobox-empty]]:text-sm",
  "[&_[data-slot=combobox-empty]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=combobox-empty]]:data-empty:py-6",
];

export function defineInternalCombobox(): void {
  if (customElements.get("kind-internal-combobox")) return;
  customElements.define(
    "kind-internal-combobox",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-combobox": HTMLElement;
  }
}
