import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@ui-sdk/react/toolbar";
import { withKindClass } from "./kind-class.js";

export const KindToolbar = withKindClass(
  Toolbar,
  "flex items-center gap-1 rounded-md border border-neutral-200 bg-white p-1 data-[orientation=vertical]:flex-col",
  "KindToolbar",
);
export const KindToolbarButton = withKindClass(
  ToolbarButton,
  "inline-flex h-7 items-center justify-center gap-1.5 rounded px-2 text-sm text-neutral-900 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-disabled:opacity-50",
  "KindToolbarButton",
);
export const KindToolbarGroup = withKindClass(
  ToolbarGroup,
  "flex items-center gap-1 data-[orientation=vertical]:flex-col",
  "KindToolbarGroup",
);
export const KindToolbarSeparator = withKindClass(
  ToolbarSeparator,
  "bg-neutral-200 data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:self-stretch data-[orientation=vertical]:mx-1 data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
  "KindToolbarSeparator",
);
