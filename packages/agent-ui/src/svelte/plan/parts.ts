import { planPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(planPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  progress: "div",
  list: "ol",
  item: "li",
  "item-icon": "span",
  "item-title": "span",
  "item-description": "span",
  accept: "button",
  outcome: "div",
  "outcome-icon": "span",
});
