import { flowGraphPrimitive } from "@kind-ui/agent-ui/core/flow-graph";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(flowGraphPrimitive, {
  root: "div",
  pane: "div",
  world: "div",
  edges: "svg",
  nodes: "div",
  node: "button",
  "node-status": "span",
  "node-label": "span",
  "node-detail": "span",
  "node-description": "span",
  controls: "div",
  "zoom-in": "button",
  "zoom-out": "button",
  fit: "button",
});
