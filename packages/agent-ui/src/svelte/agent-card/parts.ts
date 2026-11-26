import { agentCardPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(agentCardPrimitive, {
  root: "article",
  avatar: "span",
  name: "div",
  model: "p",
  description: "p",
  capabilities: "ul",
  capability: "li",
  status: "span",
  "status-icon": "span",
  action: "button",
});
