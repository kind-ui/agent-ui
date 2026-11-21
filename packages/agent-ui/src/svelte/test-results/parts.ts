import { testResultsPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(testResultsPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  filter: "div",
  count: "button",
  tree: "div",
  item: "span",
  "item-status": "span",
  failure: "div",
  empty: "p",
});
