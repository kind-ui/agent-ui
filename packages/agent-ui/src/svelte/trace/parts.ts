import { tracePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(tracePrimitive, {
  root: "div",
  viewport: "div",
  axis: "div",
  name: "span",
  status: "span",
  duration: "span",
  bar: "span",
  details: "div",
  "details-close": "button",
});
