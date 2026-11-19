import "@ui-sdk/web/carousel";

const classes = [
  "contents",
  "[&_[data-slot=carousel]]:flex",
  "[&_[data-slot=carousel]]:min-w-0",
  "[&_[data-slot=carousel]]:items-center",
  "[&_[data-slot=carousel]]:gap-1",
  "[&_[data-slot=carousel-viewport]]:min-w-0",
  "[&_[data-slot=carousel-viewport]]:flex-1",
  "[&_[data-slot=carousel-viewport]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=carousel-viewport]]:[scrollbar-width:none]",
  "[&_[data-slot=carousel-viewport]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=carousel-viewport]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=carousel-content]]:flex",
  "[&_[data-slot=carousel-content]]:gap-2",
  "[&_[data-slot=carousel-item]]:min-w-0",
  "[&_[data-slot=carousel-previous]]:inline-flex",
  "[&_[data-slot=carousel-previous]]:size-[var(--kind-control-height)]",
  "[&_[data-slot=carousel-previous]]:shrink-0",
  "[&_[data-slot=carousel-previous]]:items-center",
  "[&_[data-slot=carousel-previous]]:justify-center",
  "[&_[data-slot=carousel-previous]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=carousel-previous]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=carousel-previous]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=carousel-previous]]:hover:text-[var(--kind-color-fg)]",
  "[&_[data-slot=carousel-previous]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=carousel-previous]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=carousel-previous]]:data-disabled:cursor-default",
  "[&_[data-slot=carousel-previous]]:data-disabled:opacity-40",
  "[&_[data-slot=carousel-previous]]:data-disabled:hover:bg-transparent",
  "[&_[data-slot=carousel-previous]]:data-disabled:hover:text-[var(--kind-color-muted)]",
  "[&_[data-slot=carousel-previous]]:[&_svg]:size-4",
  "[&_[data-slot=carousel-previous]]:rtl:[&_svg]:-scale-x-100",
  "[&_[data-slot=carousel-next]]:inline-flex",
  "[&_[data-slot=carousel-next]]:size-[var(--kind-control-height)]",
  "[&_[data-slot=carousel-next]]:shrink-0",
  "[&_[data-slot=carousel-next]]:items-center",
  "[&_[data-slot=carousel-next]]:justify-center",
  "[&_[data-slot=carousel-next]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=carousel-next]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=carousel-next]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=carousel-next]]:hover:text-[var(--kind-color-fg)]",
  "[&_[data-slot=carousel-next]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=carousel-next]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=carousel-next]]:data-disabled:cursor-default",
  "[&_[data-slot=carousel-next]]:data-disabled:opacity-40",
  "[&_[data-slot=carousel-next]]:data-disabled:hover:bg-transparent",
  "[&_[data-slot=carousel-next]]:data-disabled:hover:text-[var(--kind-color-muted)]",
  "[&_[data-slot=carousel-next]]:[&_svg]:size-4",
  "[&_[data-slot=carousel-next]]:rtl:[&_svg]:-scale-x-100",
];

export function defineInternalCarousel(): void {
  if (customElements.get("kind-internal-carousel")) return;
  customElements.define(
    "kind-internal-carousel",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-carousel": HTMLElement;
  }
}
