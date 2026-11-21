import { chainOfThoughtPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(chainOfThoughtPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  list: "ol",
  item: "li",
  "item-trigger": "button",
  "item-icon": "span",
  "item-title": "span",
  "item-meta": "span",
  "item-content": "div",
});
