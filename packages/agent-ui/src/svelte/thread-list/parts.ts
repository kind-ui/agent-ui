import { threadListPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(threadListPrimitive, {
  root: "nav",
  new: "button",
  viewport: "div",
  grid: "div",
  heading: "div",
  "heading-cell": "div",
  row: "div",
  "link-cell": "div",
  link: "a",
  status: "span",
  unread: "span",
  time: "span",
  editor: "input",
  "more-cell": "div",
  more: "button",
  menu: "div",
  "menu-content": "div",
  dialog: "div",
  "dialog-error": "span",
  "dialog-cancel": "button",
  "dialog-delete": "button",
  end: "div",
  retry: "button",
});
