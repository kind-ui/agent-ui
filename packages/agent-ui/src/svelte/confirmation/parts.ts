import { confirmationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(confirmationPrimitive, {
  root: "div",
  title: "div",
  meta: "span",
  risk: "div",
  "risk-icon": "span",
  reason: "div",
  choices: "div",
  approve: "button",
  always: "button",
  deny: "button",
  cancel: "button",
  error: "span",
  detail: "div",
  outcome: "div",
  "outcome-icon": "span",
});
