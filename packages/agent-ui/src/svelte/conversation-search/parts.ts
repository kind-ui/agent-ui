import { conversationSearchPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(conversationSearchPrimitive, {
  root: "div",
  input: "div",
  count: "span",
  previous: "button",
  next: "button",
  close: "button",
});
