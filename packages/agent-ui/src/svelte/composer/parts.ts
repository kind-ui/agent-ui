import { composerPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(composerPrimitive, {
  root: "form",
  input: "div",
  "trigger-menu": "div",
  attachments: "div",
  submit: "button",
  steer: "button",
  "steer-menu": "div",
  "steer-menu-trigger": "span",
  stop: "button",
  restored: "div",
  discard: "button",
});
