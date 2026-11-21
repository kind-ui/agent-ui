import { contextBarPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(contextBarPrimitive, {
  root: "div",
  list: "ul",
  chip: "li",
  remove: "span",
  "item-remove": "span",
  overflow: "button",
  content: "div",
  viewport: "div",
  title: "h2",
  "overflow-list": "ul",
  item: "li",
});
