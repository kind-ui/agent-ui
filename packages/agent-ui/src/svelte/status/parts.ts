import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(statusPrimitive, {
  root: "span",
  icon: "span",
  label: "span",
  stalled: "span",
});
