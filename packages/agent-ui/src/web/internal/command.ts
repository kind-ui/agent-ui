import "@ui-sdk/web/command";

const classes = [
  "contents",
  "[&_[data-slot=command]]:flex",
  "[&_[data-slot=command]]:min-w-0",
  "[&_[data-slot=command]]:flex-col",
  "[&_[data-slot=command]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=command]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=command-input]]:h-[var(--kind-command-input-height,2.25rem)]",
  "[&_[data-slot=command-input]]:w-full",
  "[&_[data-slot=command-input]]:min-w-0",
  "[&_[data-slot=command-input]]:border-b",
  "[&_[data-slot=command-input]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=command-input]]:bg-transparent",
  "[&_[data-slot=command-input]]:px-3",
  "[&_[data-slot=command-input]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=command-input]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=command-input]]:outline-hidden",
  "[&_[data-slot=command-input]]:placeholder:text-[var(--kind-color-muted)]",
  "[&_[data-slot=command-list]]:max-h-[var(--kind-command-list-max-height,18rem)]",
  "[&_[data-slot=command-list]]:overflow-y-auto",
  "[&_[data-slot=command-list]]:overscroll-contain",
  "[&_[data-slot=command-list]]:p-1",
  "[&_[data-slot=command-list]]:outline-hidden",
  "[&_[data-slot=command-group]]:py-0.5",
  "[&_[data-slot=command-group-label]]:px-2.5",
  "[&_[data-slot=command-group-label]]:pt-1.5",
  "[&_[data-slot=command-group-label]]:pb-1",
  "[&_[data-slot=command-group-label]]:text-[length:var(--kind-text-xs)]/4",
  "[&_[data-slot=command-group-label]]:font-medium",
  "[&_[data-slot=command-group-label]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=command-item]]:flex",
  "[&_[data-slot=command-item]]:cursor-default",
  "[&_[data-slot=command-item]]:select-none",
  "[&_[data-slot=command-item]]:items-center",
  "[&_[data-slot=command-item]]:gap-2",
  "[&_[data-slot=command-item]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=command-item]]:px-2.5",
  "[&_[data-slot=command-item]]:py-[var(--kind-command-item-padding-block,0.375rem)]",
  "[&_[data-slot=command-item]]:outline-hidden",
  "[&_[data-slot=command-item]]:data-highlighted:bg-[var(--kind-color-selected)]",
  "[&_[data-slot=command-item]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=command-item]]:data-disabled:opacity-50",
  "[&_[data-slot=command-item]]:data-pending:cursor-wait",
  "[&_[data-slot=command-item-icon]]:inline-flex",
  "[&_[data-slot=command-item-icon]]:size-4",
  "[&_[data-slot=command-item-icon]]:shrink-0",
  "[&_[data-slot=command-item-icon]]:items-center",
  "[&_[data-slot=command-item-icon]]:justify-center",
  "[&_[data-slot=command-item-icon]]:text-[var(--kind-command-icon-color,var(--kind-color-muted))]",
  "[&_[data-slot=command-item-icon]]:[&_svg]:size-4",
  "[&_[data-slot=command-item-text]]:min-w-0",
  "[&_[data-slot=command-item-text]]:truncate",
  "[&_[data-slot=command-item-text]]:[&_mark]:bg-transparent",
  "[&_[data-slot=command-item-text]]:[&_mark]:[font-weight:var(--kind-command-mark-weight,500)]",
  "[&_[data-slot=command-item-text]]:[&_mark]:text-[var(--kind-command-mark-color,var(--kind-color-fg))]",
  "[&_[data-slot=command-shortcut]]:ms-auto",
  "[&_[data-slot=command-shortcut]]:text-[length:var(--kind-text-xs)]/4",
  "[&_[data-slot=command-shortcut]]:tracking-widest",
  "[&_[data-slot=command-shortcut]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=command-separator]]:mx-2.5",
  "[&_[data-slot=command-separator]]:my-1",
  "[&_[data-slot=command-separator]]:h-px",
  "[&_[data-slot=command-separator]]:bg-[var(--kind-color-border)]",
  "[&_[data-slot=command-empty]]:px-2",
  "[&_[data-slot=command-empty]]:text-center",
  "[&_[data-slot=command-empty]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=command-empty]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=command-empty]]:data-empty:py-6",
  "[&_[data-slot=command-status]]:px-2",
  "[&_[data-slot=command-status]]:text-center",
  "[&_[data-slot=command-status]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=command-status]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=command-status]]:not-empty:py-6",
];

export function defineInternalCommand(): void {
  if (customElements.get("kind-internal-command")) return;
  customElements.define(
    "kind-internal-command",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-command": HTMLElement;
  }
}
