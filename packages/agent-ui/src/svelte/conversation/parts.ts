import { conversationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(conversationPrimitive, {
  root: "div",
  viewport: "div",
  content: "div",
  row: "div",
  jump: "button",
  empty: "div",
  "empty-title": "div",
  "empty-description": "div",
  skeleton: "div",
  loading: "div",
  error: "div",
  "error-icon": "span",
  "error-text": "div",
  retry: "button",
  marks: "div",
  mark: "span",
});
