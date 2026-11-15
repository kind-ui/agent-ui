import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible";
import { withKindClass } from "./kind-class.js";

export const KindCollapsible = withKindClass(Collapsible, "flex flex-col gap-1", "KindCollapsible");
export const KindCollapsibleTrigger = withKindClass(
  CollapsibleTrigger,
  "inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-disabled:opacity-50",
  "KindCollapsibleTrigger",
);
export const KindCollapsiblePanel = withKindClass(
  CollapsiblePanel,
  "overflow-hidden px-2 text-sm text-neutral-700",
  "KindCollapsiblePanel",
);
