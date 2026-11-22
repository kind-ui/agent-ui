import { connectionStatusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(connectionStatusPrimitive, {
  root: "div",
  mark: "span",
  text: "span",
  retry: "button",
});
