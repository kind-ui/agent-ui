import {
  TriggerMenu,
  TriggerMenuContent,
  TriggerMenuEmpty,
  TriggerMenuInput,
  TriggerMenuItem,
  TriggerMenuList,
} from "@ui-sdk/react/trigger-menu";
import { withKindClass } from "./kind-class.js";

export const KindTriggerMenu = TriggerMenu;
export const KindTriggerMenuInput = withKindClass(
  TriggerMenuInput,
  "min-h-16 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-disabled:opacity-50",
  "KindTriggerMenuInput",
);
export const KindTriggerMenuContent = withKindClass(
  TriggerMenuContent,
  "z-50 min-w-40 rounded-md border border-neutral-200 bg-white p-1 text-sm text-neutral-900 shadow-md outline-none",
  "KindTriggerMenuContent",
);
export const KindTriggerMenuList = withKindClass(TriggerMenuList, "flex flex-col", "KindTriggerMenuList");
export const KindTriggerMenuItem = withKindClass(
  TriggerMenuItem,
  "flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 outline-none focus-visible:bg-neutral-100 data-highlighted:bg-neutral-100 data-disabled:opacity-50",
  "KindTriggerMenuItem",
);
export const KindTriggerMenuEmpty = withKindClass(
  TriggerMenuEmpty,
  "px-2 py-1.5 text-neutral-600",
  "KindTriggerMenuEmpty",
);
