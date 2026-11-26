import "@ui-sdk/web/timeline";

// `ui-timeline-time` binds the `<time>` inside it, so the grid places the element itself.
const classes = [
  "contents",
  "[&_[data-slot=timeline]]:flex",
  "[&_[data-slot=timeline]]:flex-col",
  "[&_[data-slot=timeline-item]]:relative",
  "[&_[data-slot=timeline-item]]:grid",
  "[&_[data-slot=timeline-item]]:grid-cols-[1rem_minmax(0,1fr)]",
  "[&_[data-slot=timeline-item]]:gap-x-3",
  "[&_[data-slot=timeline-item]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=timeline-item]]:px-1",
  "[&_[data-slot=timeline-item]]:pb-4",
  "[&_[data-slot=timeline-item]]:outline-hidden",
  "[&_[data-slot=timeline-item]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=timeline-item]]:focus-visible:[outline-offset:var(--kind-focus-offset-inset)]",
  "[&_[data-slot=timeline-marker]]:col-start-1",
  "[&_[data-slot=timeline-marker]]:row-start-1",
  "[&_[data-slot=timeline-marker]]:flex",
  "[&_[data-slot=timeline-marker]]:h-5",
  "[&_[data-slot=timeline-marker]]:items-center",
  "[&_[data-slot=timeline-marker]]:justify-center",
  "[&_[data-slot=timeline-connector]]:absolute",
  "[&_[data-slot=timeline-connector]]:start-[calc(0.25rem+0.5rem-0.5px)]",
  "[&_[data-slot=timeline-connector]]:top-6",
  "[&_[data-slot=timeline-connector]]:bottom-1",
  "[&_[data-slot=timeline-connector]]:w-px",
  "[&_[data-slot=timeline-connector]]:bg-[var(--kind-color-hairline)]",
  "[&_[data-slot=timeline-item][data-last]>[data-slot=timeline-connector]]:hidden",
  "[&_[data-slot=timeline-title]]:col-start-2",
  "[&_[data-slot=timeline-title]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=timeline-title]]:font-medium",
  "[&_[data-slot=timeline-title]]:text-[var(--kind-color-fg)]",
  "[&_ui-timeline-time]:col-start-2",
  "[&_ui-timeline-time]:text-[length:var(--kind-text-sm)]/5",
  "[&_ui-timeline-time]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=timeline-description]]:col-start-2",
  "[&_[data-slot=timeline-description]]:mt-1",
  "[&_[data-slot=timeline-description]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=timeline-description]]:text-[var(--kind-color-fg)]",
];

export function defineInternalTimeline(): void {
  if (customElements.get("kind-internal-timeline")) return;
  customElements.define(
    "kind-internal-timeline",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-timeline": HTMLElement;
  }
}
