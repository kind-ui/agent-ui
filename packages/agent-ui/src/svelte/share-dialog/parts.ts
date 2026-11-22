import { shareDialogPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(shareDialogPrimitive, {
  root: "div",
  trigger: "button",
  backdrop: "div",
  viewport: "div",
  content: "div",
  title: "h2",
  description: "p",
  visibility: "div",
  link: "div",
  create: "button",
  copy: "button",
  revoke: "button",
  error: "p",
  close: "button",
});
