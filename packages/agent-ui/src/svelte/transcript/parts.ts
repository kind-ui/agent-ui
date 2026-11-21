import { transcriptPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(transcriptPrimitive, {
  root: "div",
  search: "div",
  count: "span",
  viewport: "div",
  list: "div",
  segment: "div",
  speaker: "span",
  seek: "button",
  time: "span",
  text: "p",
  word: "span",
});
