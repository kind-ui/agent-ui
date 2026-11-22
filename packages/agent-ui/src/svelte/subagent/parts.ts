import { subagentPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(subagentPrimitive, {
  root: "div",
  trigger: "button",
  avatar: "span",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  children: "div",
  cancel: "button",
  result: "div",
});
