"use client";

import {
  FileInput,
  FileInputDropzone,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
} from "@ui-sdk/react/file-input";
import { withKindClass } from "./kind-class.js";

export const KindFileInput = withKindClass(FileInput, "flex flex-col gap-2", "KindFileInput");
export const KindFileInputTrigger = withKindClass(
  FileInputTrigger,
  "inline-flex h-[var(--kind-control-height)] items-center justify-center gap-1.5 rounded-[var(--kind-radius-full)] bg-[var(--kind-color-raised)] px-3.5 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-disabled:cursor-not-allowed data-disabled:opacity-[var(--kind-disabled-opacity)] data-pending:cursor-wait shadow-[0_0_0_1px_var(--kind-color-hairline)] active:bg-[var(--kind-color-pressed)] active:scale-[var(--kind-press-scale)] motion-reduce:active:scale-100 transition-[background-color,color,scale] duration-[var(--kind-duration-fast)]",
  "KindFileInputTrigger",
);
export const KindFileInputDropzone = withKindClass(
  FileInputDropzone,
  "flex flex-col items-center gap-2 rounded-[var(--kind-radius-md)] border border-dashed border-[var(--kind-color-border)] p-4 text-[length:var(--kind-text-md)]/5 text-[var(--kind-color-fg)] data-dragging:border-[var(--kind-color-fg)] data-drag-accept:bg-[var(--kind-color-hover)] data-drag-reject:border-[var(--kind-color-danger)]",
  "KindFileInputDropzone",
);
export const KindFileInputList = withKindClass(FileInputList, "flex flex-col gap-1", "KindFileInputList");
export const KindFileInputItem = withKindClass(
  FileInputItem,
  "flex items-center gap-2 rounded-[var(--kind-radius-md)] border border-[var(--kind-color-border)] px-2 py-1 text-[length:var(--kind-text-md)]/5 text-[var(--kind-color-fg)]",
  "KindFileInputItem",
);
export const KindFileInputItemRemove = withKindClass(
  FileInputItemRemove,
  "inline-flex size-6 items-center justify-center rounded-[var(--kind-radius-full)] text-[var(--kind-color-muted)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)]",
  "KindFileInputItemRemove",
);
