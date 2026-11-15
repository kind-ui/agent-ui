import "@ui-sdk/web/avatar";

const classes = [
  "contents",
  "[&_[data-slot=avatar]]:relative",
  "[&_[data-slot=avatar]]:inline-flex",
  "[&_[data-slot=avatar]]:size-8",
  "[&_[data-slot=avatar]]:shrink-0",
  "[&_[data-slot=avatar]]:items-center",
  "[&_[data-slot=avatar]]:justify-center",
  "[&_[data-slot=avatar]]:overflow-hidden",
  "[&_[data-slot=avatar]]:rounded-full",
  "[&_[data-slot=avatar]]:bg-neutral-200",
  "[&_[data-slot=avatar]]:text-xs",
  "[&_[data-slot=avatar]]:font-medium",
  "[&_[data-slot=avatar]]:text-neutral-900",
  "[&_[data-slot=avatar-image]]:size-full",
  "[&_[data-slot=avatar-image]]:object-cover",
  "[&_[data-slot=avatar-fallback]]:flex",
  "[&_[data-slot=avatar-fallback]]:size-full",
  "[&_[data-slot=avatar-fallback]]:items-center",
  "[&_[data-slot=avatar-fallback]]:justify-center",
];

export function defineInternalAvatar(): void {
  if (customElements.get("kind-internal-avatar")) return;
  customElements.define(
    "kind-internal-avatar",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}
