import { feedbackPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(feedbackPrimitive, {
  root: "div",
  thumbs: "div",
  comment: "button",
  thanks: "span",
  content: "div",
  title: "h2",
  "comment-text": "div",
  "comment-send": "button",
  "comment-status": "span",
  "comment-status-icon": "span",
  "comment-error": "span",
});
