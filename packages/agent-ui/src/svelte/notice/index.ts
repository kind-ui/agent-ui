import { noticePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(noticePrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  description: "div",
  reset: "p",
  actions: "div",
  dismiss: "button",
});

export { default as Notice } from "./Notice.svelte";
/** The bare root, for arranging the parts yourself. */
export const NoticeRoot = parts.Root;
export const NoticeIcon = parts.Icon;
export const NoticeDescription = parts.Description;
export const NoticeActions = parts.Actions;
export const NoticeDismiss = parts.Dismiss;
export { default as NoticeReset } from "./NoticeReset.svelte";
export { default as NoticeTitle } from "./NoticeTitle.svelte";
