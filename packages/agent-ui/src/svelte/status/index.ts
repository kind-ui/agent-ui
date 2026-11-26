import { statusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(statusPrimitive, {
  root: "span",
  icon: "span",
  label: "span",
  stalled: "span",
});

export { default as Status } from "./Status.svelte";
export const StatusIcon = parts.Icon;
export { default as StatusLabel } from "./StatusLabel.svelte";
export { default as StatusStalled } from "./StatusStalled.svelte";
