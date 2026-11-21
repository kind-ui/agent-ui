import { sourcesPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(sourcesPrimitive, {
  root: "div",
  trigger: "button",
  content: "div",
  list: "ul",
  item: "li",
  link: "a",
  icon: "span",
  title: "span",
  host: "span",
  snippet: "p",
});
