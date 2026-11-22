import { Button } from "@ui-sdk/solid/button";
import { withKindClass } from "./kind-class.js";

export const KindButton = withKindClass(
  Button,
  "inline-flex h-[var(--kind-control-height)] items-center justify-center gap-1.5 rounded-[var(--kind-radius-full)] px-3.5 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-disabled:cursor-not-allowed data-disabled:opacity-[var(--kind-disabled-opacity)] data-pending:cursor-wait active:bg-[var(--kind-color-pressed)] active:scale-[var(--kind-press-scale)] motion-reduce:active:scale-100 transition-[background-color,color,scale] duration-[var(--kind-duration-fast)]",
);
