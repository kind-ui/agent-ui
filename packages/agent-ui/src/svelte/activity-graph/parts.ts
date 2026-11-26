import { activityGraphPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(activityGraphPrimitive, {
  root: "div",
  viewport: "div",
  grid: "div",
  months: "div",
  month: "span",
  row: "div",
  weekday: "div",
  cell: "div",
  legend: "div",
  swatch: "span",
  summary: "p",
});
