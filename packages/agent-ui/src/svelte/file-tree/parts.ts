import { fileTreePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(fileTreePrimitive, {
  root: "div",
  item: "span",
  counts: "span",
  badge: "span",
});
