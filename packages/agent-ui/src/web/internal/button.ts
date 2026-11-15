import "@ui-sdk/web/button";

const classes = [
  "contents",
  "[&_[data-slot=button]]:inline-flex",
  "[&_[data-slot=button]]:h-8",
  "[&_[data-slot=button]]:items-center",
  "[&_[data-slot=button]]:justify-center",
  "[&_[data-slot=button]]:gap-1.5",
  "[&_[data-slot=button]]:rounded-md",
  "[&_[data-slot=button]]:border",
  "[&_[data-slot=button]]:border-neutral-300",
  "[&_[data-slot=button]]:bg-white",
  "[&_[data-slot=button]]:px-3",
  "[&_[data-slot=button]]:text-sm",
  "[&_[data-slot=button]]:font-medium",
  "[&_[data-slot=button]]:text-neutral-900",
  "[&_[data-slot=button]]:hover:bg-neutral-100",
  "[&_[data-slot=button]]:focus-visible:outline-2",
  "[&_[data-slot=button]]:focus-visible:outline-offset-2",
  "[&_[data-slot=button]]:focus-visible:outline-neutral-900",
  "[&_[data-slot=button]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=button]]:data-disabled:opacity-50",
  "[&_[data-slot=button]]:data-pending:cursor-wait",
];

export function defineInternalButton(): void {
  if (customElements.get("kind-internal-button")) return;
  customElements.define(
    "kind-internal-button",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
