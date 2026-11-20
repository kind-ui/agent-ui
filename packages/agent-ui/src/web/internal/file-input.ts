import "@ui-sdk/web/file-input";

const classes = [
  "contents",
  "[&_[data-slot=file-input]]:flex",
  "[&_[data-slot=file-input]]:flex-col",
  "[&_[data-slot=file-input]]:gap-2",
  "[&_[data-slot=file-input-trigger]]:inline-flex",
  "[&_[data-slot=file-input-trigger]]:h-[var(--kind-control-height)]",
  "[&_[data-slot=file-input-trigger]]:items-center",
  "[&_[data-slot=file-input-trigger]]:justify-center",
  "[&_[data-slot=file-input-trigger]]:gap-1.5",
  "[&_[data-slot=file-input-trigger]]:rounded-[var(--kind-radius-full)]",
  "[&_[data-slot=file-input-trigger]]:bg-[var(--kind-color-raised)]",
  "[&_[data-slot=file-input-trigger]]:px-3.5",
  "[&_[data-slot=file-input-trigger]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=file-input-trigger]]:font-medium",
  "[&_[data-slot=file-input-trigger]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=file-input-trigger]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=file-input-trigger]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=file-input-trigger]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "[&_[data-slot=file-input-trigger]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=file-input-trigger]]:data-disabled:opacity-[var(--kind-disabled-opacity)]",
  "[&_[data-slot=file-input-trigger]]:data-pending:cursor-wait",
  "[&_[data-slot=file-input-trigger]]:shadow-[0_0_0_1px_var(--kind-color-hairline)]",
  "[&_[data-slot=file-input-trigger]]:active:bg-[var(--kind-color-pressed)]",
  "[&_[data-slot=file-input-trigger]]:active:scale-[var(--kind-press-scale)]",
  "[&_[data-slot=file-input-trigger]]:motion-reduce:active:scale-100",
  "[&_[data-slot=file-input-trigger]]:transition-[background-color,color,scale]",
  "[&_[data-slot=file-input-trigger]]:duration-[var(--kind-duration-fast)]",
  "[&_[data-slot=file-input-dropzone]]:flex",
  "[&_[data-slot=file-input-dropzone]]:flex-col",
  "[&_[data-slot=file-input-dropzone]]:items-center",
  "[&_[data-slot=file-input-dropzone]]:gap-2",
  "[&_[data-slot=file-input-dropzone]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=file-input-dropzone]]:border",
  "[&_[data-slot=file-input-dropzone]]:border-dashed",
  "[&_[data-slot=file-input-dropzone]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=file-input-dropzone]]:p-4",
  "[&_[data-slot=file-input-dropzone]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=file-input-dropzone]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=file-input-dropzone]]:data-dragging:border-[var(--kind-color-fg)]",
  "[&_[data-slot=file-input-dropzone]]:data-drag-accept:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=file-input-dropzone]]:data-drag-reject:border-[var(--kind-color-danger)]",
  "[&_[data-slot=file-input-list]]:flex",
  "[&_[data-slot=file-input-list]]:flex-col",
  "[&_[data-slot=file-input-list]]:gap-1",
  "[&_[data-slot=file-input-item]]:flex",
  "[&_[data-slot=file-input-item]]:items-center",
  "[&_[data-slot=file-input-item]]:gap-2",
  "[&_[data-slot=file-input-item]]:rounded-[var(--kind-radius-md)]",
  "[&_[data-slot=file-input-item]]:border",
  "[&_[data-slot=file-input-item]]:border-[var(--kind-color-border)]",
  "[&_[data-slot=file-input-item]]:px-2",
  "[&_[data-slot=file-input-item]]:py-1",
  "[&_[data-slot=file-input-item]]:text-[length:var(--kind-text-md)]/5",
  "[&_[data-slot=file-input-item]]:text-[var(--kind-color-fg)]",
  "[&_[data-slot=file-input-item-remove]]:inline-flex",
  "[&_[data-slot=file-input-item-remove]]:size-6",
  "[&_[data-slot=file-input-item-remove]]:items-center",
  "[&_[data-slot=file-input-item-remove]]:justify-center",
  "[&_[data-slot=file-input-item-remove]]:rounded-[var(--kind-radius-full)]",
  "[&_[data-slot=file-input-item-remove]]:text-[var(--kind-color-muted)]",
  "[&_[data-slot=file-input-item-remove]]:hover:bg-[var(--kind-color-hover)]",
  "[&_[data-slot=file-input-item-remove]]:focus-visible:[outline:var(--kind-focus-ring)]",
  "[&_[data-slot=file-input-item-remove]]:focus-visible:[outline-offset:var(--kind-focus-offset)]",
];

export function defineInternalFileInput(): void {
  if (customElements.get("kind-internal-file-input")) return;
  customElements.define(
    "kind-internal-file-input",
    class extends HTMLElement {
      connectedCallback(): void {
        this.classList.add(...classes);
      }
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-internal-file-input": HTMLElement;
  }
}
