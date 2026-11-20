import "@ui-sdk/web/scroll-area";

const classes = [
  "contents",
  "[&_[data-slot=scroll-area]]:relative",
  "[&_[data-slot=scroll-area]]:overflow-hidden",
  "[&_[data-slot=scroll-area-viewport]]:size-full",
  "[&_[data-slot=scroll-area-viewport]]:rounded-[inherit]",
  "[&_[data-slot=scroll-area-viewport]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=scroll-area-viewport]]:focus-visible:[outline-offset:var(--kind-focus-offset-inset)]",
  "[&_[data-slot=scroll-area-content]]:min-w-full",
  "[&_[data-slot=scroll-area-scrollbar]]:flex",
  "[&_[data-slot=scroll-area-scrollbar]]:touch-none",
  "[&_[data-slot=scroll-area-scrollbar]]:select-none",
  "[&_[data-slot=scroll-area-scrollbar]]:p-0.5",
  "[&_[data-slot=scroll-area-scrollbar]]:opacity-0",
  "[&_[data-slot=scroll-area-scrollbar]]:data-visible:opacity-100",
  "[&_[data-slot=scroll-area-scrollbar]]:data-[orientation=horizontal]:h-2.5",
  "[&_[data-slot=scroll-area-scrollbar]]:data-[orientation=horizontal]:flex-col",
  "[&_[data-slot=scroll-area-scrollbar]]:data-[orientation=vertical]:w-2.5",
  "[&_[data-slot=scroll-area-thumb]]:flex-1",
  "[&_[data-slot=scroll-area-thumb]]:rounded-full",
  "[&_[data-slot=scroll-area-thumb]]:bg-[color-mix(in_oklab,var(--kind-color-muted)_55%,transparent)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:inline-flex",
  "[&_[data-slot=scroll-area-scroll-to-end]]:h-[var(--kind-control-height)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:items-center",
  "[&_[data-slot=scroll-area-scroll-to-end]]:justify-center",
  "[&_[data-slot=scroll-area-scroll-to-end]]:gap-1.5",
  "[&_[data-slot=scroll-area-scroll-to-end]]:rounded-[var(--kind-radius-full)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:bg-[var(--kind-color-raised)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:px-3.5",
  "[&_[data-slot=scroll-area-scroll-to-end]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=scroll-area-scroll-to-end]]:font-medium",
  "[&_[data-slot=scroll-area-scroll-to-end]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-disabled:opacity-50",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-pending:cursor-wait",
  "[&_[data-slot=scroll-area-scroll-to-end]]:opacity-0",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-visible:opacity-100",
  "[&_[data-slot=scroll-area-scroll-to-end]]:shadow-[0_0_0_1px_var(--kind-color-hairline)]",
];

export function defineInternalScrollArea(): void {
  if (customElements.get("kind-internal-scroll-area")) return;
  customElements.define(
    "kind-internal-scroll-area",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-scroll-area": HTMLElement;
  }
}
