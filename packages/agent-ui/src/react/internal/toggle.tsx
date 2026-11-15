import { Toggle, ToggleIcon } from "@ui-sdk/react/toggle";
import { withKindClass } from "./kind-class.js";

export const KindToggle = withKindClass(
  Toggle,
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-pressed:bg-neutral-900 data-pressed:text-white data-disabled:opacity-50",
  "KindToggle",
);
export const KindToggleIcon = withKindClass(ToggleIcon, "inline-flex size-4 shrink-0", "KindToggleIcon");
