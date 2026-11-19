"use client";

import { Button } from "@ui-sdk/react/button";
import { withKindClass } from "./kind-class.js";

export const KindButton = withKindClass(
  Button,
  "inline-flex h-[var(--kind-control-height)] items-center justify-center gap-1.5 rounded-[var(--kind-radius-md)] border border-transparent px-3 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-disabled:cursor-not-allowed data-disabled:opacity-50 data-pending:cursor-wait",
  "KindButton",
);
