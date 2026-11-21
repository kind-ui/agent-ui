import { documentPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(documentPrimitive, {
  root: "div",
  header: "div",
  title: "span",
  meta: "span",
  toolbar: "div",
  copy: "span",
  download: "span",
  body: "div",
  content: "div",
  expand: "button",
});
