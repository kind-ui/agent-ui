import "@ui-sdk/web/switch";

const classes = [
  "contents",
  "[&_[data-slot=switch]]:inline-flex",
  "[&_[data-slot=switch]]:h-[18px]",
  "[&_[data-slot=switch]]:w-8",
  "[&_[data-slot=switch]]:shrink-0",
  "[&_[data-slot=switch]]:cursor-pointer",
  "[&_[data-slot=switch]]:items-center",
  "[&_[data-slot=switch]]:rounded-full",
  "[&_[data-slot=switch]]:bg-[var(--kind-color-border)]",
  "[&_[data-slot=switch]]:p-0.5",
  "[&_[data-slot=switch]]:outline-hidden",
  "[&_[data-slot=switch]]:transition-colors",
  "[&_[data-slot=switch]]:duration-[120ms]",
  "[&_[data-slot=switch]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=switch]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=switch]]:motion-reduce:transition-none",
  "[&_[data-slot=switch]]:data-checked:bg-[var(--kind-color-accent)]",
  "[&_[data-slot=switch]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=switch]]:data-disabled:opacity-[var(--kind-disabled-opacity)]",
  "[&_[data-slot=switch-thumb]]:block",
  "[&_[data-slot=switch-thumb]]:size-3.5",
  "[&_[data-slot=switch-thumb]]:rounded-full",
  "[&_[data-slot=switch-thumb]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=switch-thumb]]:shadow-sm",
  "[&_[data-slot=switch-thumb]]:shadow-[color:var(--kind-color-shadow)]/10",
  "[&_[data-slot=switch-thumb]]:transition-transform",
  "[&_[data-slot=switch-thumb]]:duration-[120ms]",
  "[&_[data-slot=switch-thumb]]:motion-reduce:transition-none",
  "[&_[data-slot=switch-thumb]]:data-checked:translate-x-3.5",
  "[&_[data-slot=switch-thumb]]:rtl:data-checked:-translate-x-3.5",
];

export function defineInternalSwitch(): void {
  if (customElements.get("kind-internal-switch")) return;
  customElements.define(
    "kind-internal-switch",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-switch": HTMLElement;
  }
}
