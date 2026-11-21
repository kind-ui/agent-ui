import { stackTracePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(stackTracePrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  content: "div",
  message: "div",
  copy: "button",
  list: "ol",
  frame: "li",
  "frame-open": "button",
  "frame-function": "span",
  "frame-location": "span",
  group: "li",
  library: "button",
  "library-frames": "ol",
});
