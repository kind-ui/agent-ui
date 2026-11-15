import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@ui-sdk/react/menu";
import { withKindClass } from "./kind-class.js";

export const KindMenu = Menu;
export const KindMenuTrigger = withKindClass(
  MenuTrigger,
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-pending:cursor-wait",
  "KindMenuTrigger",
);
export const KindMenuContent = withKindClass(
  MenuContent,
  "z-50 min-w-40 rounded-md border border-neutral-200 bg-white p-1 text-sm text-neutral-900 shadow-md outline-none",
  "KindMenuContent",
);
export const KindMenuItem = withKindClass(
  MenuItem,
  "flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 outline-none focus-visible:bg-neutral-100 data-highlighted:bg-neutral-100 data-disabled:opacity-50",
  "KindMenuItem",
);
export const KindMenuSeparator = withKindClass(
  MenuSeparator,
  "-mx-1 my-1 h-px bg-neutral-200",
  "KindMenuSeparator",
);
