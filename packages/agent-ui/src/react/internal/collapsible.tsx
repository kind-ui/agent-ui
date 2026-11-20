"use client";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/react/collapsible";
import { withKindClass } from "./kind-class.js";

export const KindCollapsible = withKindClass(Collapsible, "flex flex-col gap-1", "KindCollapsible");
export const KindCollapsibleTrigger = withKindClass(
  CollapsibleTrigger,
  "inline-flex items-center gap-1.5 self-start rounded-[var(--kind-radius-md)] px-2 py-1 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-disabled:opacity-[var(--kind-disabled-opacity)]",
  "KindCollapsibleTrigger",
);
export const KindCollapsiblePanel = withKindClass(
  CollapsiblePanel,
  "overflow-hidden px-2 text-[length:var(--kind-text-md)]/5 text-[var(--kind-color-fg)]",
  "KindCollapsiblePanel",
);
