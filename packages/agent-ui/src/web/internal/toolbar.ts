import "@ui-sdk/web/toolbar";

const classes = [
  "contents",
  "[&_[data-slot=toolbar]]:flex",
  "[&_[data-slot=toolbar]]:items-center",
  "[&_[data-slot=toolbar]]:gap-0.5",
  "[&_[data-slot=toolbar]]:data-[orientation=vertical]:flex-col",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:inline-flex",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:h-[var(--kind-control-height-sm)]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:min-w-[var(--kind-control-height-sm)]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:items-center",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:justify-center",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:gap-1.5",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:rounded-[var(--kind-radius-full)]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:px-2",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:text-[length:var(--kind-text-md)]/5",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:text-[var(--kind-toolbar-button-fg,var(--kind-color-muted))]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:hover:bg-[var(--kind-color-hover)]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:hover:text-[var(--kind-color-fg)]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_:is([data-slot=toolbar-button],ui-toolbar-button_[data-slot=menu-trigger])]:data-disabled:opacity-50",
  "[&_[data-slot=toolbar-group]]:flex",
  "[&_[data-slot=toolbar-group]]:items-center",
  "[&_[data-slot=toolbar-group]]:gap-1",
  "[&_[data-slot=toolbar-group]]:data-[orientation=vertical]:flex-col",
  "[&_[data-slot=toolbar-separator]]:bg-[var(--kind-color-border)]",
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

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-toolbar": HTMLElement;
  }
}
