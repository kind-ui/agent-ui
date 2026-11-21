import { sidebarPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(sidebarPrimitive, {
  root: "div",
  title: "aside",
  handle: "div",
  inset: "div",
  trigger: "button",
});
