import "@ui-sdk/web/token-input";

const classes = [
  "contents",
  "[&_[data-slot=token-input-editor]]:min-h-16",
  "[&_[data-slot=token-input-editor]]:whitespace-pre-wrap",
  "[&_[data-slot=token-input-editor]]:w-full",
  "[&_[data-slot=token-input-editor]]:rounded-[calc(var(--kind-radius)/2)]",
  "[&_[data-slot=token-input-editor]]:border",
  "[&_[data-slot=token-input-editor]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=token-input-editor]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=token-input-editor]]:px-3",
  "[&_[data-slot=token-input-editor]]:py-2",
  "[&_[data-slot=token-input-editor]]:text-sm",
  "[&_[data-slot=token-input-editor]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=token-input-editor]]:focus-visible:outline-2",
  "[&_[data-slot=token-input-editor]]:focus-visible:outline-offset-2",
  "[&_[data-slot=token-input-editor]]:focus-visible:outline-[var(--kind-color-ring)]",
  "[&_[data-slot=token-input-editor]]:data-disabled:opacity-50",
  "[&_[data-slot=token-input-editor]]:[&_[data-slot=token-input-host]]:whitespace-nowrap",
  "[&_[data-slot=token-input-editor]]:data-empty:before:pointer-events-none",
  "[&_[data-slot=token-input-editor]]:data-empty:before:text-[var(--kind-color-muted)]",
  "[&_[data-slot=token-input-editor]]:data-empty:before:content-[attr(aria-placeholder)]",
  "[&_[data-slot=token-input-token]]:inline-flex",
  "[&_[data-slot=token-input-token]]:items-center",
  "[&_[data-slot=token-input-token]]:gap-1",
  "[&_[data-slot=token-input-token]]:rounded-[calc(var(--kind-radius)/3)]",
  "[&_[data-slot=token-input-token]]:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=token-input-token]]:px-1.5",
  "[&_[data-slot=token-input-token]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=token-input-token]]:data-selected:bg-[var(--kind-color-fg)]",
  "[&_[data-slot=token-input-token]]:data-selected:text-[var(--kind-color-surface)]",
  "[&_[data-slot=token-input-token]]:data-unresolved:outline",
  "[&_[data-slot=token-input-token]]:data-unresolved:outline-dashed",
  "[&_[data-slot=token-input-token]]:data-unresolved:outline-[var(--kind-color-muted)]",
  "[&_[data-slot=token-input-token-remove]]:inline-flex",
  "[&_[data-slot=token-input-token-remove]]:size-4",
  "[&_[data-slot=token-input-token-remove]]:cursor-pointer",
  "[&_[data-slot=token-input-token-remove]]:items-center",
  "[&_[data-slot=token-input-token-remove]]:justify-center",
  "[&_[data-slot=token-input-token-remove]]:rounded-[calc(var(--kind-radius)/3)]",
  "[&_[data-slot=token-input-token-remove]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=token-input-token-remove]]:hover:text-[var(--kind-color-fg)]",
];

export function defineInternalTokenInput(): void {
  if (customElements.get("kind-internal-token-input")) return;
  customElements.define(
    "kind-internal-token-input",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-token-input": HTMLElement;
  }
}
