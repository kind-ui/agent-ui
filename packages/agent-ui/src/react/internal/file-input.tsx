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
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-pending:cursor-wait",
  "KindFileInputTrigger",
);
export const KindFileInputDropzone = withKindClass(
  FileInputDropzone,
  "flex flex-col items-center gap-2 rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-700 data-dragging:border-neutral-900 data-drag-accept:bg-neutral-50 data-drag-reject:border-red-700",
  "KindFileInputDropzone",
);
export const KindFileInputList = withKindClass(FileInputList, "flex flex-col gap-1", "KindFileInputList");
export const KindFileInputItem = withKindClass(
  FileInputItem,
  "flex items-center gap-2 rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-900",
  "KindFileInputItem",
);
export const KindFileInputItemRemove = withKindClass(
  FileInputItemRemove,
  "inline-flex size-6 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
  "KindFileInputItemRemove",
);
