import { contextMeterPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(contextMeterPrimitive, {
  root: "div",
  trigger: "button",
  value: "span",
  content: "div",
  title: "h2",
  description: "p",
  rows: "dl",
  viewport: "div",
  compact: "button",
  compacting: "span",
  "compacting-icon": "span",
  bar: "div",
  breakdown: "ul",
  limits: "div",
});
