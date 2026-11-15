import "@ui-sdk/web/toolbar";

const classes = [
  "contents",
  "[&_[data-slot=toolbar]]:flex",
  "[&_[data-slot=toolbar]]:items-center",
  "[&_[data-slot=toolbar]]:gap-1",
  "[&_[data-slot=toolbar]]:rounded-md",
  "[&_[data-slot=toolbar]]:border",
  "[&_[data-slot=toolbar]]:border-neutral-200",
  "[&_[data-slot=toolbar]]:bg-white",
  "[&_[data-slot=toolbar]]:p-1",
  "[&_[data-slot=toolbar]]:data-[orientation=vertical]:flex-col",
  "[&_[data-slot=toolbar-button]]:inline-flex",
  "[&_[data-slot=toolbar-button]]:h-7",
  "[&_[data-slot=toolbar-button]]:items-center",
  "[&_[data-slot=toolbar-button]]:justify-center",
  "[&_[data-slot=toolbar-button]]:gap-1.5",
  "[&_[data-slot=toolbar-button]]:rounded",
  "[&_[data-slot=toolbar-button]]:px-2",
  "[&_[data-slot=toolbar-button]]:text-sm",
  "[&_[data-slot=toolbar-button]]:text-neutral-900",
  "[&_[data-slot=toolbar-button]]:hover:bg-neutral-100",
  "[&_[data-slot=toolbar-button]]:focus-visible:outline-2",
  "[&_[data-slot=toolbar-button]]:focus-visible:outline-offset-2",
  "[&_[data-slot=toolbar-button]]:focus-visible:outline-neutral-900",
  "[&_[data-slot=toolbar-button]]:data-disabled:opacity-50",
  "[&_[data-slot=toolbar-group]]:flex",
  "[&_[data-slot=toolbar-group]]:items-center",
  "[&_[data-slot=toolbar-group]]:gap-1",
  "[&_[data-slot=toolbar-group]]:data-[orientation=vertical]:flex-col",
  "[&_[data-slot=toolbar-separator]]:bg-neutral-200",
  "[&_[data-slot=toolbar-separator]]:data-[orientation=horizontal]:my-1",
  "[&_[data-slot=toolbar-separator]]:data-[orientation=horizontal]:h-px",
  "[&_[data-slot=toolbar-separator]]:data-[orientation=horizontal]:self-stretch",
  "[&_[data-slot=toolbar-separator]]:data-[orientation=vertical]:mx-1",
  "[&_[data-slot=toolbar-separator]]:data-[orientation=vertical]:w-px",
  "[&_[data-slot=toolbar-separator]]:data-[orientation=vertical]:self-stretch",
];

export function defineInternalToolbar(): void {
  if (customElements.get("kind-internal-toolbar")) return;
  customElements.define(
    "kind-internal-toolbar",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
