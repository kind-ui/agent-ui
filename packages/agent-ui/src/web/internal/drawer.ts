import "@ui-sdk/web/drawer";

const classes = [
  "contents",
  "[&_[data-slot=drawer-backdrop]]:fixed",
  "[&_[data-slot=drawer-backdrop]]:inset-0",
  "[&_[data-slot=drawer-backdrop]]:z-50",
  "[&_[data-slot=drawer-backdrop]]:bg-[var(--kind-color-scrim)]",
  "[&_[data-slot=drawer-backdrop]]:backdrop-blur-[var(--kind-scrim-blur)]",
  "[&_[data-slot=drawer-content]]:flex",
  "[&_[data-slot=drawer-content]]:h-full",
  "[&_[data-slot=drawer-content]]:max-h-dvh",
  "[&_[data-slot=drawer-content]]:w-[min(20rem,calc(100vw-3rem))]",
  "[&_[data-slot=drawer-content]]:flex-col",
  "[&_[data-slot=drawer-content]]:overflow-hidden",
  "[&_[data-slot=drawer-content]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=drawer-content]]:bg-[var(--kind-color-raised)]",
  "[&_[data-slot=drawer-content]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=drawer-content]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=drawer-content]]:shadow-[var(--kind-shadow-dialog)]",
  "[&_[data-slot=drawer-content]]:outline-hidden",
  "[&_[data-slot=drawer-content]]:data-[side=left]:border-e",
  "[&_[data-slot=drawer-content]]:data-[side=right]:border-s",
  "[&_[data-slot=drawer-content]]:data-[side=top]:h-auto",
  "[&_[data-slot=drawer-content]]:data-[side=top]:w-full",
  "[&_[data-slot=drawer-content]]:data-[side=top]:border-b",
  "[&_[data-slot=drawer-content]]:data-[side=bottom]:h-auto",
  "[&_[data-slot=drawer-content]]:data-[side=bottom]:w-full",
  "[&_[data-slot=drawer-content]]:data-[side=bottom]:border-t",
  "[&_[data-slot=drawer-title]]:m-0",
  "[&_[data-slot=drawer-title]]:block",
  "[&_[data-slot=drawer-title]]:text-[length:var(--kind-text-xl)]",
  "[&_[data-slot=drawer-title]]:font-semibold",
  "[&_[data-slot=drawer-title]]:leading-6",
  "[&_[data-slot=drawer-description]]:m-0",
  "[&_[data-slot=drawer-description]]:block",
  "[&_[data-slot=drawer-description]]:text-[var(--kind-color-muted)]",
];

export function defineInternalDrawer(): void {
  if (customElements.get("kind-internal-drawer")) return;
  customElements.define(
    "kind-internal-drawer",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-drawer": HTMLElement;
  }
}
