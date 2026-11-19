"use client";

import { Toggle, ToggleIcon } from "@ui-sdk/react/toggle";
import { withKindClass } from "./kind-class.js";

export const KindToggle = withKindClass(
  Toggle,
  "inline-flex h-[var(--kind-control-height)] items-center justify-center gap-1.5 rounded-[var(--kind-radius-md)] px-2 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-pressed:bg-[var(--kind-color-selected)] data-disabled:opacity-50",
  "KindToggle",
);
export const KindToggleIcon = withKindClass(ToggleIcon, "inline-flex size-4 shrink-0", "KindToggleIcon");
