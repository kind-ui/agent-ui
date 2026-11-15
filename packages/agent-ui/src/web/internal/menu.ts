import "@ui-sdk/web/menu";

const classes = [
  "contents",
  "[&_[data-slot=menu-trigger]]:inline-flex",
  "[&_[data-slot=menu-trigger]]:h-8",
  "[&_[data-slot=menu-trigger]]:items-center",
  "[&_[data-slot=menu-trigger]]:justify-center",
  "[&_[data-slot=menu-trigger]]:gap-1.5",
  "[&_[data-slot=menu-trigger]]:rounded-[calc(var(--kind-radius)/2)]",
  "[&_[data-slot=menu-trigger]]:border",
  "[&_[data-slot=menu-trigger]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=menu-trigger]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=menu-trigger]]:px-3",
  "[&_[data-slot=menu-trigger]]:text-sm",
  "[&_[data-slot=menu-trigger]]:font-medium",
  "[&_[data-slot=menu-trigger]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=menu-trigger]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=menu-trigger]]:focus-visible:outline-2",
  "[&_[data-slot=menu-trigger]]:focus-visible:outline-offset-2",
  "[&_[data-slot=menu-trigger]]:focus-visible:outline-[var(--kind-color-ring)]",
  "[&_[data-slot=menu-trigger]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=menu-trigger]]:data-disabled:opacity-50",
  "[&_[data-slot=menu-trigger]]:data-pending:cursor-wait",
  "[&_[data-slot=menu-content]]:z-50",
  "[&_[data-slot=menu-content]]:min-w-40",
  "[&_[data-slot=menu-content]]:rounded-[calc(var(--kind-radius)/2)]",
  "[&_[data-slot=menu-content]]:border",
  "[&_[data-slot=menu-content]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=menu-content]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=menu-content]]:p-1",
  "[&_[data-slot=menu-content]]:text-sm",
  "[&_[data-slot=menu-content]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=menu-content]]:shadow-md",
  "[&_[data-slot=menu-content]]:shadow-[color:var(--kind-color-shadow)]/10",
  "[&_[data-slot=menu-content]]:outline-none",
  "[&_[data-slot=menu-item]]:flex",
  "[&_[data-slot=menu-item]]:cursor-default",
  "[&_[data-slot=menu-item]]:select-none",
  "[&_[data-slot=menu-item]]:items-center",
  "[&_[data-slot=menu-item]]:gap-2",
  "[&_[data-slot=menu-item]]:rounded-[calc(var(--kind-radius)/3)]",
  "[&_[data-slot=menu-item]]:px-2",
  "[&_[data-slot=menu-item]]:py-1.5",
  "[&_[data-slot=menu-item]]:outline-none",
  "[&_[data-slot=menu-item]]:focus-visible:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=menu-item]]:data-highlighted:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=menu-item]]:data-disabled:opacity-50",
  "[&_[data-slot=menu-separator]]:-mx-1",
  "[&_[data-slot=menu-separator]]:my-1",
  "[&_[data-slot=menu-separator]]:h-px",
  "[&_[data-slot=menu-separator]]:bg-[var(--kind-color-border)]",
];

export function defineInternalMenu(): void {
  if (customElements.get("kind-internal-menu")) return;
  customElements.define(
    "kind-internal-menu",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
