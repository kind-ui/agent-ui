import { threadSearchPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(threadSearchPrimitive, {
  root: "div",
  trigger: "button",
  backdrop: "div",
  content: "div",
  viewport: "div",
  command: "div",
  item: "span",
  shortcut: "kbd",
  hints: "div",
  status: "span",
});
