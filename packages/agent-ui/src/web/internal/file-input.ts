import "@ui-sdk/web/file-input";

// The import registers the ready-made <ui-file-input> elements. This light-DOM host styles their data-slot parts.
const classes = [
  "contents",
  "[&_[data-slot=file-input]]:flex",
  "[&_[data-slot=file-input]]:flex-col",
  "[&_[data-slot=file-input]]:gap-2",
  "[&_[data-slot=file-input-trigger]]:inline-flex",
  "[&_[data-slot=file-input-trigger]]:h-8",
  "[&_[data-slot=file-input-trigger]]:items-center",
  "[&_[data-slot=file-input-trigger]]:justify-center",
  "[&_[data-slot=file-input-trigger]]:gap-1.5",
  "[&_[data-slot=file-input-trigger]]:rounded-md",
  "[&_[data-slot=file-input-trigger]]:border",
  "[&_[data-slot=file-input-trigger]]:border-neutral-300",
  "[&_[data-slot=file-input-trigger]]:bg-white",
  "[&_[data-slot=file-input-trigger]]:px-3",
  "[&_[data-slot=file-input-trigger]]:text-sm",
  "[&_[data-slot=file-input-trigger]]:font-medium",
  "[&_[data-slot=file-input-trigger]]:text-neutral-900",
  "[&_[data-slot=file-input-trigger]]:hover:bg-neutral-100",
  "[&_[data-slot=file-input-trigger]]:focus-visible:outline-2",
  "[&_[data-slot=file-input-trigger]]:focus-visible:outline-offset-2",
  "[&_[data-slot=file-input-trigger]]:focus-visible:outline-neutral-900",
  "[&_[data-slot=file-input-trigger]]:data-disabled:cursor-not-allowed",
  "[&_[data-slot=file-input-trigger]]:data-disabled:opacity-50",
  "[&_[data-slot=file-input-trigger]]:data-pending:cursor-wait",
  "[&_[data-slot=file-input-dropzone]]:flex",
  "[&_[data-slot=file-input-dropzone]]:flex-col",
  "[&_[data-slot=file-input-dropzone]]:items-center",
  "[&_[data-slot=file-input-dropzone]]:gap-2",
  "[&_[data-slot=file-input-dropzone]]:rounded-md",
  "[&_[data-slot=file-input-dropzone]]:border",
  "[&_[data-slot=file-input-dropzone]]:border-dashed",
  "[&_[data-slot=file-input-dropzone]]:border-neutral-300",
  "[&_[data-slot=file-input-dropzone]]:p-4",
  "[&_[data-slot=file-input-dropzone]]:text-sm",
  "[&_[data-slot=file-input-dropzone]]:text-neutral-700",
  "[&_[data-slot=file-input-dropzone]]:data-dragging:border-neutral-900",
  "[&_[data-slot=file-input-dropzone]]:data-drag-accept:bg-neutral-50",
  "[&_[data-slot=file-input-dropzone]]:data-drag-reject:border-red-700",
  "[&_[data-slot=file-input-list]]:flex",
  "[&_[data-slot=file-input-list]]:flex-col",
  "[&_[data-slot=file-input-list]]:gap-1",
  "[&_[data-slot=file-input-item]]:flex",
  "[&_[data-slot=file-input-item]]:items-center",
  "[&_[data-slot=file-input-item]]:gap-2",
  "[&_[data-slot=file-input-item]]:rounded-md",
  "[&_[data-slot=file-input-item]]:border",
  "[&_[data-slot=file-input-item]]:border-neutral-200",
  "[&_[data-slot=file-input-item]]:px-2",
  "[&_[data-slot=file-input-item]]:py-1",
  "[&_[data-slot=file-input-item]]:text-sm",
  "[&_[data-slot=file-input-item]]:text-neutral-900",
  "[&_[data-slot=file-input-item-remove]]:inline-flex",
  "[&_[data-slot=file-input-item-remove]]:size-6",
  "[&_[data-slot=file-input-item-remove]]:items-center",
  "[&_[data-slot=file-input-item-remove]]:justify-center",
  "[&_[data-slot=file-input-item-remove]]:rounded",
  "[&_[data-slot=file-input-item-remove]]:text-neutral-600",
  "[&_[data-slot=file-input-item-remove]]:hover:bg-neutral-100",
  "[&_[data-slot=file-input-item-remove]]:focus-visible:outline-2",
  "[&_[data-slot=file-input-item-remove]]:focus-visible:outline-offset-2",
  "[&_[data-slot=file-input-item-remove]]:focus-visible:outline-neutral-900",
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
