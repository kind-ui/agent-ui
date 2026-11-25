import { jobProgressPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(jobProgressPrimitive, {
  root: "div",
  trigger: "button",
  icon: "span",
  title: "span",
  meta: "span",
  progress: "div",
  stage: "span",
  content: "div",
  children: "div",
  cancel: "button",
  retry: "button",
});
