import {
  TokenInput,
  TokenInputEditor,
  TokenInputToken,
  TokenInputTokenRemove,
} from "@ui-sdk/react/token-input";
import { withKindClass } from "./kind-class.js";

export const KindTokenInput = TokenInput;
export const KindTokenInputEditor = withKindClass(
  TokenInputEditor,
  "min-h-16 whitespace-pre-wrap w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-disabled:opacity-50 [&_[data-slot=token-input-host]]:whitespace-nowrap data-empty:before:pointer-events-none data-empty:before:text-neutral-600 data-empty:before:content-[attr(aria-placeholder)]",
  "KindTokenInputEditor",
);
export const KindTokenInputToken = withKindClass(
  TokenInputToken,
  "inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 text-neutral-900 data-selected:bg-neutral-900 data-selected:text-white data-unresolved:outline data-unresolved:outline-dashed data-unresolved:outline-neutral-600",
  "KindTokenInputToken",
);
export const KindTokenInputTokenRemove = withKindClass(
  TokenInputTokenRemove,
  "inline-flex size-4 cursor-pointer items-center justify-center rounded text-neutral-600 hover:text-neutral-900",
  "KindTokenInputTokenRemove",
);
