import { handoffPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(handoffPrimitive, {
  root: "div",
  "from-avatar": "span",
  "to-avatar": "span",
  text: "p",
  reason: "blockquote",
  status: "span",
  "status-icon": "span",
  approval: "div",
});
