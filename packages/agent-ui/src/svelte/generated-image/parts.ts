import { generatedImagePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(generatedImagePrimitive, {
  root: "div",
  frame: "div",
  preview: "img",
  progress: "div",
  image: "img",
  error: "div",
  trigger: "button",
  download: "button",
  backdrop: "div",
  content: "div",
  "full-image": "img",
  title: "h2",
  close: "button",
});
