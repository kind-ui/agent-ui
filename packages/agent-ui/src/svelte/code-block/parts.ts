import { codeBlockPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(codeBlockPrimitive, {
  root: "div",
  header: "div",
  language: "span",
  wrap: "button",
  copy: "button",
  code: "pre",
});
