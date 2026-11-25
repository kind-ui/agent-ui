import { diffPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(diffPrimitive, {
  root: "figure",
  header: "div",
  path: "span",
  status: "span",
  stats: "span",
  copy: "button",
  accept: "button",
  revert: "button",
  viewport: "div",
  table: "div",
  row: "div",
  "old-number": "span",
  "new-number": "span",
  sign: "span",
  code: "span",
  collapsed: "button",
  "collapsed-text": "span",
});
