import { markdownTablePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(markdownTablePrimitive, {
  root: "div",
  header: "div",
  copy: "button",
  table: "table",
});
