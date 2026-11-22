import { queuePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(queuePrimitive, {
  root: "div",
  section: "div",
  "section-trigger": "button",
  "section-content": "div",
  list: "ul",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-description": "span",
  "item-remove": "span",
  instructions: "span",
});
