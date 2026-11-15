import "@ui-sdk/web/collapsible";

// The import registers the ready-made <ui-collapsible> elements. This light-DOM host styles their data-slot parts.
const classes = [
  "contents",
  "[&_[data-slot=collapsible]]:flex",
  "[&_[data-slot=collapsible]]:flex-col",
  "[&_[data-slot=collapsible]]:gap-1",
  "[&_[data-slot=collapsible-trigger]]:inline-flex",
  "[&_[data-slot=collapsible-trigger]]:items-center",
  "[&_[data-slot=collapsible-trigger]]:gap-1.5",
  "[&_[data-slot=collapsible-trigger]]:self-start",
  "[&_[data-slot=collapsible-trigger]]:rounded-md",
  "[&_[data-slot=collapsible-trigger]]:px-2",
  "[&_[data-slot=collapsible-trigger]]:py-1",
  "[&_[data-slot=collapsible-trigger]]:text-sm",
  "[&_[data-slot=collapsible-trigger]]:font-medium",
  "[&_[data-slot=collapsible-trigger]]:text-neutral-900",
  "[&_[data-slot=collapsible-trigger]]:hover:bg-neutral-100",
  "[&_[data-slot=collapsible-trigger]]:focus-visible:outline-2",
  "[&_[data-slot=collapsible-trigger]]:focus-visible:outline-offset-2",
  "[&_[data-slot=collapsible-trigger]]:focus-visible:outline-neutral-900",
  "[&_[data-slot=collapsible-trigger]]:data-disabled:opacity-50",
  "[&_[data-slot=collapsible-panel]]:overflow-hidden",
  "[&_[data-slot=collapsible-panel]]:px-2",
  "[&_[data-slot=collapsible-panel]]:text-sm",
  "[&_[data-slot=collapsible-panel]]:text-neutral-700",
];

export function defineInternalCollapsible(): void {
  if (customElements.get("kind-internal-collapsible")) return;
  customElements.define(
    "kind-internal-collapsible",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
