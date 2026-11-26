import { toolPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(toolPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  approval: "span",
  content: "div",
  input: "div",
  "input-copy": "button",
  output: "div",
  "output-copy": "button",
  retry: "p",
  error: "p",
  "retry-button": "button",
});
