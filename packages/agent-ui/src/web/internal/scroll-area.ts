import "@ui-sdk/web/scroll-area";

// The import registers the ready-made <ui-scroll-area> elements. This light-DOM host styles their data-slot parts.
const classes = [
  "contents",
  "[&_[data-slot=scroll-area]]:relative",
  "[&_[data-slot=scroll-area]]:overflow-hidden",
  "[&_[data-slot=scroll-area-viewport]]:size-full",
  "[&_[data-slot=scroll-area-viewport]]:rounded-[inherit]",
  "[&_[data-slot=scroll-area-viewport]]:focus-visible:outline-2",
  "[&_[data-slot=scroll-area-viewport]]:focus-visible:outline-offset-2",
  "[&_[data-slot=scroll-area-viewport]]:focus-visible:outline-neutral-900",
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
  "[&_[data-slot=scroll-area-thumb]]:bg-neutral-400",
  "[&_[data-slot=scroll-area-scroll-to-end]]:inline-flex",
  "[&_[data-slot=scroll-area-scroll-to-end]]:h-8",
  "[&_[data-slot=scroll-area-scroll-to-end]]:items-center",
  "[&_[data-slot=scroll-area-scroll-to-end]]:justify-center",
  "[&_[data-slot=scroll-area-scroll-to-end]]:gap-1.5",
  "[&_[data-slot=scroll-area-scroll-to-end]]:rounded-md",
  "[&_[data-slot=scroll-area-scroll-to-end]]:border",
  "[&_[data-slot=scroll-area-scroll-to-end]]:border-neutral-300",
  "[&_[data-slot=scroll-area-scroll-to-end]]:bg-white",
  "[&_[data-slot=scroll-area-scroll-to-end]]:px-3",
  "[&_[data-slot=scroll-area-scroll-to-end]]:text-sm",
  "[&_[data-slot=scroll-area-scroll-to-end]]:font-medium",
  "[&_[data-slot=scroll-area-scroll-to-end]]:text-neutral-900",
  "[&_[data-slot=scroll-area-scroll-to-end]]:hover:bg-neutral-100",
  "[&_[data-slot=scroll-area-scroll-to-end]]:focus-visible:outline-2",
  "[&_[data-slot=scroll-area-scroll-to-end]]:focus-visible:outline-offset-2",
  "[&_[data-slot=scroll-area-scroll-to-end]]:focus-visible:outline-neutral-900",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-disabled:opacity-50",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-pending:cursor-wait",
  "[&_[data-slot=scroll-area-scroll-to-end]]:opacity-0",
  "[&_[data-slot=scroll-area-scroll-to-end]]:data-visible:opacity-100",
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
