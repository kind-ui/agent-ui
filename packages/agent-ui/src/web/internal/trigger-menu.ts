import "@ui-sdk/web/trigger-menu";

const classes = [
  "contents",
  "[&_[data-slot=trigger-menu-input]]:min-h-16",
  "[&_[data-slot=trigger-menu-input]]:w-full",
  "[&_[data-slot=trigger-menu-input]]:rounded-md",
  "[&_[data-slot=trigger-menu-input]]:border",
  "[&_[data-slot=trigger-menu-input]]:border-[var(--kind-border)]",
  "[&_[data-slot=trigger-menu-input]]:bg-[var(--kind-surface)]",
  "[&_[data-slot=trigger-menu-input]]:px-3",
  "[&_[data-slot=trigger-menu-input]]:py-2",
  "[&_[data-slot=trigger-menu-input]]:text-sm",
  "[&_[data-slot=trigger-menu-input]]:text-[var(--kind-fg)]",
  "[&_[data-slot=trigger-menu-input]]:focus-visible:outline-2",
  "[&_[data-slot=trigger-menu-input]]:focus-visible:outline-offset-2",
  "[&_[data-slot=trigger-menu-input]]:focus-visible:outline-[var(--kind-ring)]",
  "[&_[data-slot=trigger-menu-input]]:data-disabled:opacity-50",
  "[&_[data-slot=trigger-menu-content]]:z-50",
  "[&_[data-slot=trigger-menu-content]]:min-w-40",
  "[&_[data-slot=trigger-menu-content]]:rounded-md",
  "[&_[data-slot=trigger-menu-content]]:border",
  "[&_[data-slot=trigger-menu-content]]:border-[var(--kind-border)]",
  "[&_[data-slot=trigger-menu-content]]:bg-[var(--kind-surface)]",
  "[&_[data-slot=trigger-menu-content]]:p-1",
  "[&_[data-slot=trigger-menu-content]]:text-sm",
  "[&_[data-slot=trigger-menu-content]]:text-[var(--kind-fg)]",
  "[&_[data-slot=trigger-menu-content]]:shadow-md",
  "[&_[data-slot=trigger-menu-content]]:outline-none",
  "[&_[data-slot=trigger-menu-list]]:flex",
  "[&_[data-slot=trigger-menu-list]]:flex-col",
  "[&_[data-slot=trigger-menu-item]]:flex",
  "[&_[data-slot=trigger-menu-item]]:cursor-default",
  "[&_[data-slot=trigger-menu-item]]:select-none",
  "[&_[data-slot=trigger-menu-item]]:items-center",
  "[&_[data-slot=trigger-menu-item]]:gap-2",
  "[&_[data-slot=trigger-menu-item]]:rounded",
  "[&_[data-slot=trigger-menu-item]]:px-2",
  "[&_[data-slot=trigger-menu-item]]:py-1.5",
  "[&_[data-slot=trigger-menu-item]]:outline-none",
  "[&_[data-slot=trigger-menu-item]]:focus-visible:bg-[var(--kind-hover)]",
  "[&_[data-slot=trigger-menu-item]]:data-highlighted:bg-[var(--kind-hover)]",
  "[&_[data-slot=trigger-menu-item]]:data-disabled:opacity-50",
  "[&_[data-slot=trigger-menu-empty]]:px-2",
  "[&_[data-slot=trigger-menu-empty]]:py-1.5",
  "[&_[data-slot=trigger-menu-empty]]:text-[var(--kind-muted-fg)]",
];

export function defineInternalTriggerMenu(): void {
  if (customElements.get("kind-internal-trigger-menu")) return;
  customElements.define(
    "kind-internal-trigger-menu",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
