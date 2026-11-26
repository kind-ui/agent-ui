import { runTimelinePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(runTimelinePrimitive, {
  root: "div",
  item: "div",
  marker: "span",
  title: "span",
  time: "span",
  actor: "span",
  description: "div",
  end: "div",
  more: "button",
});
