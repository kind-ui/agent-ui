import "@ui-sdk/web/tree";

const classes = [
  "contents",
  "[&_[data-slot=tree]]:flex",
  "[&_[data-slot=tree]]:flex-col",
  "[&_[data-slot=tree]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=tree]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=tree-item]]:outline-hidden",
  "[&_[data-slot=tree-item]:focus-visible>[data-slot=tree-label]]:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=tree-item]:focus-visible>[data-slot=tree-label]]:[outline-offset:var(--kind-focus-offset-inset)]",
  "[&_[data-slot=tree-label]]:flex",
  "[&_[data-slot=tree-label]]:min-h-7",
  "[&_[data-slot=tree-label]]:cursor-default",
  "[&_[data-slot=tree-label]]:items-center",
  "[&_[data-slot=tree-label]]:gap-1.5",
  "[&_[data-slot=tree-label]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=tree-label]]:ps-[calc((var(--tree-level)-1)*1rem+0.25rem)]",
  "[&_[data-slot=tree-label]]:pe-2",
  "[&_[data-slot=tree-label]]:select-none",
  "[&_[data-slot=tree-label]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=tree-label]]:data-selected:bg-[color-mix(in_oklab,var(--kind-color-accent)_12%,transparent)]",
  "[&_[data-slot=tree-label]]:data-disabled:opacity-50",
  "[&_[data-slot=tree-indicator]]:inline-flex",
  "[&_[data-slot=tree-indicator]]:size-4",
  "[&_[data-slot=tree-indicator]]:shrink-0",
  "[&_[data-slot=tree-indicator]]:items-center",
  "[&_[data-slot=tree-indicator]]:justify-center",
  "[&_[data-slot=tree-indicator]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=tree-indicator]]:[&_svg]:size-3.5",
  "[&_[data-slot=tree-indicator]]:rtl:[&_svg]:-scale-x-100",
  "[&_[data-slot=tree-indicator]]:data-expanded:[&_svg]:rotate-90",
  "[&_[data-slot=tree-indicator]]:rtl:data-expanded:[&_svg]:-rotate-90",
];

export function defineInternalTree(): void {
  if (customElements.get("kind-internal-tree")) return;
  customElements.define(
    "kind-internal-tree",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-tree": HTMLElement;
  }
}
