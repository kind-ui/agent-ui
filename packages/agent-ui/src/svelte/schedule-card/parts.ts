import { scheduleCardPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(scheduleCardPrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  description: "p",
  next: "p",
  last: "p",
  "last-mark": "span",
  "last-link": "a",
  enabled: "label",
  "run-now": "button",
  edit: "button",
});
