import { Button } from "@ui-sdk/react/button";
import { withKindClass } from "./kind-class.js";

export const KindButton = withKindClass(
  Button,
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-pending:cursor-wait",
  "KindButton",
);
