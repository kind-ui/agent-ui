import "@ui-sdk/web/waterfall";

const grid = (slot: string) => [
  `[&_[data-slot=${slot}]]:grid`,
  `[&_[data-slot=${slot}]]:[grid-template-columns:var(--kind-waterfall-columns,minmax(10rem,2fr)_minmax(4.5rem,auto)_3fr)]`,
  `[&_[data-slot=${slot}]]:items-center`,
  `[&_[data-slot=${slot}]]:h-[var(--kind-waterfall-row-height,1.75rem)]`,
];
const cell = (slot: string) => [
  `[&_[data-slot=${slot}]]:flex`,
  `[&_[data-slot=${slot}]]:min-w-0`,
  `[&_[data-slot=${slot}]]:h-full`,
  `[&_[data-slot=${slot}]]:items-center`,
  `[&_[data-slot=${slot}]]:px-2`,
  `[&_[data-slot=${slot}]]:outline-hidden`,
  `[&_[data-slot=${slot}]:focus-visible]:[outline:var(--kind-focus-ring)]`,
  `[&_[data-slot=${slot}]:focus-visible]:[outline-offset:var(--kind-focus-offset-inset)]`,
];

const classes = [
  "contents",
  "[&_[data-slot=waterfall]]:relative",
  "[&_[data-slot=waterfall]]:block",
  "[&_[data-slot=waterfall]]:text-[length:var(--kind-text-sm)]/5",
  "[&_[data-slot=waterfall]]:text-[var(--kind-color-fg)]",
  ...grid("waterfall-header-row"),
  "[&_[data-slot=waterfall-header-row]]:box-border",
  "[&_[data-slot=waterfall-header-row]]:border-b",
  "[&_[data-slot=waterfall-header-row]]:border-[var(--kind-color-hairline)]",
  "[&_[data-slot=waterfall-header-row]]:bg-[var(--kind-color-surface)]",
  "[&_[data-slot=waterfall-header-row]]:text-[length:var(--kind-text-xs)]",
  "[&_[data-slot=waterfall-header-row]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=waterfall-column-header]]:relative",
  "[&_[data-slot=waterfall-column-header]]:flex",
  "[&_[data-slot=waterfall-column-header]]:min-w-0",
  "[&_[data-slot=waterfall-column-header]]:h-full",
  "[&_[data-slot=waterfall-column-header]]:items-center",
  "[&_[data-slot=waterfall-column-header]]:px-2",
  "[&_[data-slot=waterfall-axis]]:relative",
  "[&_[data-slot=waterfall-axis]]:block",
  "[&_[data-slot=waterfall-axis]]:h-full",
  "[&_[data-slot=waterfall-axis]]:w-full",
  ...grid("waterfall-row"),
  "[&_[data-slot=waterfall-row][hidden]]:hidden",
  "[&_[data-slot=waterfall-row]]:cursor-default",
  "[&_[data-slot=waterfall-row]]:rounded-[var(--kind-radius-sm)]",
  "[&_[data-slot=waterfall-row]]:outline-hidden",
  "[&_[data-slot=waterfall-row]]:select-none",
  "[&_[data-slot=waterfall-row]:hover]:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=waterfall-row][data-selected]]:bg-[var(--kind-color-selected)]",
  "[&_[data-slot=waterfall-row]:focus-visible]:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=waterfall-row]:focus-visible]:[outline-offset:var(--kind-focus-offset-inset)]",
  ...cell("waterfall-row-header"),
  "[&_[data-slot=waterfall-row-header]]:gap-1.5",
  "[&_[data-slot=waterfall-row-header]]:ps-[calc((var(--waterfall-level)-1)*1rem+0.25rem)]",
  "[&_[data-slot=waterfall-indicator]]:inline-flex",
  "[&_[data-slot=waterfall-indicator]]:size-4",
  "[&_[data-slot=waterfall-indicator]]:shrink-0",
  "[&_[data-slot=waterfall-indicator]]:items-center",
  "[&_[data-slot=waterfall-indicator]]:justify-center",
  "[&_[data-slot=waterfall-indicator]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=waterfall-indicator]_svg]:size-3.5",
  "[&_[data-slot=waterfall-indicator]_svg]:rtl:-scale-x-100",
  "[&_[data-slot=waterfall-indicator][data-expanded]_svg]:rotate-90",
  "[&_[data-slot=waterfall-indicator][data-expanded]_svg]:rtl:-rotate-90",
  ...cell("waterfall-cell"),
  "[&_[data-slot=waterfall-cell]]:justify-end",
  "[&_[data-slot=waterfall-cell]]:tabular-nums",
  "[&_[data-slot=waterfall-cell]]:text-[var(--kind-color-muted)]",
  ...cell("waterfall-bar"),
  "[&_[data-slot=waterfall-bar]]:relative",
];

export function defineInternalWaterfall(): void {
  if (customElements.get("kind-internal-waterfall")) return;
  customElements.define(
    "kind-internal-waterfall",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-waterfall": HTMLElement;
  }
}
