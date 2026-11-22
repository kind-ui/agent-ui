import { dictationButtonPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(dictationButtonPrimitive, {
  root: "div",
  start: "button",
  waveform: "span",
  bar: "span",
  status: "span",
  "status-icon": "span",
  stop: "button",
  cancel: "button",
});
