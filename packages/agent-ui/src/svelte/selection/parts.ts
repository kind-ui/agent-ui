import { selectionPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(selectionPrimitive, {
  root: "div",
  content: "div",
  toolbar: "div",
  item: "span",
});
