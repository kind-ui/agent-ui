import { confirmationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(confirmationPrimitive, {
  root: "div",
  title: "div",
  reason: "div",
  choices: "div",
  approve: "button",
  deny: "button",
  cancel: "button",
  error: "span",
  outcome: "div",
  "outcome-icon": "span",
});
