import { uploaderPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(uploaderPrimitive, {
  root: "div",
  list: "ul",
  item: "li",
  action: "button",
});

export { default as Uploader } from "./Uploader.svelte";
export { default as UploaderItem } from "./UploaderItem.svelte";
