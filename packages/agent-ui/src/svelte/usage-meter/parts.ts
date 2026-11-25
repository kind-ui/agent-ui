import { usageMeterPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(usageMeterPrimitive, {
  root: "div",
  trigger: "button",
  value: "span",
  content: "div",
  title: "h2",
  description: "p",
  breakdown: "div",
  "breakdown-rows": "dl",
  period: "p",
});
