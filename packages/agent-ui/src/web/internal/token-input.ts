import "@ui-sdk/web/token-input";

const classes = [
  "contents",
  "[&_[data-slot=token-input-editor]]:min-h-16",
  "[&_[data-slot=token-input-editor]]:whitespace-pre-wrap",
  "[&_[data-slot=token-input-editor]]:w-full",
  "[&_[data-slot=token-input-editor]]:rounded-md",
  "[&_[data-slot=token-input-editor]]:border",
  "[&_[data-slot=token-input-editor]]:border-neutral-300",
  "[&_[data-slot=token-input-editor]]:bg-white",
  "[&_[data-slot=token-input-editor]]:px-3",
  "[&_[data-slot=token-input-editor]]:py-2",
  "[&_[data-slot=token-input-editor]]:text-sm",
  "[&_[data-slot=token-input-editor]]:text-neutral-900",
  "[&_[data-slot=token-input-editor]]:focus-visible:outline-2",
  "[&_[data-slot=token-input-editor]]:focus-visible:outline-offset-2",
  "[&_[data-slot=token-input-editor]]:focus-visible:outline-neutral-900",
  "[&_[data-slot=token-input-editor]]:data-disabled:opacity-50",
  "[&_[data-slot=token-input-editor]]:[&_[data-slot=token-input-host]]:whitespace-nowrap",
  "[&_[data-slot=token-input-editor]]:data-empty:before:pointer-events-none",
  "[&_[data-slot=token-input-editor]]:data-empty:before:text-neutral-600",
  "[&_[data-slot=token-input-editor]]:data-empty:before:content-[attr(aria-placeholder)]",
  "[&_[data-slot=token-input-token]]:inline-flex",
  "[&_[data-slot=token-input-token]]:items-center",
  "[&_[data-slot=token-input-token]]:gap-1",
  "[&_[data-slot=token-input-token]]:rounded",
  "[&_[data-slot=token-input-token]]:bg-neutral-100",
  "[&_[data-slot=token-input-token]]:px-1.5",
  "[&_[data-slot=token-input-token]]:text-neutral-900",
  "[&_[data-slot=token-input-token]]:data-selected:bg-neutral-900",
  "[&_[data-slot=token-input-token]]:data-selected:text-white",
  "[&_[data-slot=token-input-token]]:data-unresolved:outline",
  "[&_[data-slot=token-input-token]]:data-unresolved:outline-dashed",
  "[&_[data-slot=token-input-token]]:data-unresolved:outline-neutral-600",
  "[&_[data-slot=token-input-token-remove]]:inline-flex",
  "[&_[data-slot=token-input-token-remove]]:size-4",
  "[&_[data-slot=token-input-token-remove]]:cursor-pointer",
  "[&_[data-slot=token-input-token-remove]]:items-center",
  "[&_[data-slot=token-input-token-remove]]:justify-center",
  "[&_[data-slot=token-input-token-remove]]:rounded",
  "[&_[data-slot=token-input-token-remove]]:text-neutral-600",
  "[&_[data-slot=token-input-token-remove]]:hover:text-neutral-900",
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
