import { Toggle, ToggleIcon } from "@ui-sdk/svelte/toggle";
import { withKindClass } from "../kind-class.js";

export const KindToggle = withKindClass(
  Toggle,
  "inline-flex h-[var(--kind-control-height)] items-center justify-center gap-1.5 rounded-[var(--kind-radius-full)] px-3 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-pressed:bg-[var(--kind-color-selected)] data-disabled:opacity-[var(--kind-disabled-opacity)] active:bg-[var(--kind-color-pressed)] active:scale-[var(--kind-press-scale)] motion-reduce:active:scale-100 transition-[background-color,color,scale] duration-[var(--kind-duration-fast)]",
);
export const KindToggleIcon = withKindClass(ToggleIcon, "inline-flex size-4 shrink-0");
