import "@ui-sdk/web/textarea";

const classes = [
  "contents",
  "[&_[data-slot=textarea]]:block",
  "[&_[data-slot=textarea]]:min-h-16",
  "[&_[data-slot=textarea]]:max-h-40",
  "[&_[data-slot=textarea]]:w-full",
  "[&_[data-slot=textarea]]:resize-none",
  "[&_[data-slot=textarea]]:rounded-[calc(var(--kind-radius)*2/3)]",
  "[&_[data-slot=textarea]]:border",
  "[&_[data-slot=textarea]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=textarea]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=textarea]]:px-3",
  "[&_[data-slot=textarea]]:py-2",
  "[&_[data-slot=textarea]]:text-sm",
  "[&_[data-slot=textarea]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=textarea]]:placeholder:text-[var(--kind-color-muted)]",
  "[&_[data-slot=textarea]]:focus-visible:outline-2",
  "[&_[data-slot=textarea]]:focus-visible:outline-offset-2",
  "[&_[data-slot=textarea]]:focus-visible:outline-[var(--kind-color-ring)]",
  "[&_[data-slot=textarea]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=textarea]]:data-disabled:opacity-50",
  "[&_[data-slot=textarea]]:data-readonly:text-[var(--kind-color-muted)]",
];

export function defineInternalTextarea(): void {
  if (customElements.get("kind-internal-textarea")) return;
  customElements.define(
    "kind-internal-textarea",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-textarea": HTMLElement;
  }
}
