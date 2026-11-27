import { terminalPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(terminalPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  exit: "span",
  meta: "span",
  approval: "div",
  content: "div",
  command: "div",
  copy: "button",
  viewport: "div",
  output: "div",
  line: "div",
  jump: "button",
});
