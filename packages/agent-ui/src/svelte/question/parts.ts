import { questionPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(questionPrimitive, {
  root: "form",
  item: "fieldset",
  prompt: "legend",
  choices: "div",
  text: "div",
  actions: "div",
  submit: "button",
  skip: "button",
  status: "span",
  "status-icon": "span",
  error: "span",
  summary: "div",
  "summary-icon": "span",
});
