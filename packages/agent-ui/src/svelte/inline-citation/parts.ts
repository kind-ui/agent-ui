import { inlineCitationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

// Every part is a `span`, so a citation is valid inside a paragraph.
export const parts = createParts(inlineCitationPrimitive, {
  root: "span",
  trigger: "button",
  content: "span",
  carousel: "span",
  item: "span",
  link: "a",
  icon: "span",
  host: "span",
  "source-title": "span",
  snippet: "span",
  index: "span",
});
