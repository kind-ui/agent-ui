import "@ui-sdk/web/alert-dialog";

const classes = [
  "contents",
  "[&_[data-slot=alert-dialog-backdrop]]:fixed",
  "[&_[data-slot=alert-dialog-backdrop]]:inset-0",
  "[&_[data-slot=alert-dialog-backdrop]]:z-50",
  "[&_[data-slot=alert-dialog-backdrop]]:bg-[var(--kind-color-scrim)]",
  "[&_[data-slot=alert-dialog-backdrop]]:backdrop-blur-[var(--kind-scrim-blur)]",
  "[&_[data-slot=alert-dialog-content]]:fixed",
  "[&_[data-slot=alert-dialog-content]]:inset-0",
  "[&_[data-slot=alert-dialog-content]]:z-50",
  "[&_[data-slot=alert-dialog-content]]:m-auto",
  "[&_[data-slot=alert-dialog-content]]:flex",
  "[&_[data-slot=alert-dialog-content]]:h-fit",
  "[&_[data-slot=alert-dialog-content]]:max-h-[calc(100dvh-2rem)]",
  "[&_[data-slot=alert-dialog-content]]:w-[min(26rem,calc(100%-2rem))]",
  "[&_[data-slot=alert-dialog-content]]:flex-col",
  "[&_[data-slot=alert-dialog-content]]:gap-2",
  "[&_[data-slot=alert-dialog-content]]:overflow-y-auto",
  "[&_[data-slot=alert-dialog-content]]:rounded-[var(--kind-dialog-radius)]",
  "[&_[data-slot=alert-dialog-content]]:bg-[var(--kind-color-raised)]",
  "[&_[data-slot=alert-dialog-content]]:p-6",
  "[&_[data-slot=alert-dialog-content]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=alert-dialog-content]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=alert-dialog-content]]:shadow-[var(--kind-shadow-dialog)]",
  "[&_[data-slot=alert-dialog-content]]:outline-hidden",
  "[&_[data-slot=alert-dialog-title]]:m-0",
  "[&_[data-slot=alert-dialog-title]]:block",
  "[&_[data-slot=alert-dialog-title]]:text-[length:var(--kind-text-xl)]",
  "[&_[data-slot=alert-dialog-title]]:font-semibold",
  "[&_[data-slot=alert-dialog-title]]:leading-6",
  "[&_[data-slot=alert-dialog-description]]:m-0",
  "[&_[data-slot=alert-dialog-description]]:block",
  "[&_[data-slot=alert-dialog-description]]:text-[var(--kind-color-muted)]",
];

export function defineInternalAlertDialog(): void {
  if (customElements.get("kind-internal-alert-dialog")) return;
  customElements.define(
    "kind-internal-alert-dialog",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-alert-dialog": HTMLElement;
  }
}
