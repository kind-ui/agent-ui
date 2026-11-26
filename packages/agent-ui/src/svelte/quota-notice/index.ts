import { quotaNoticePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(quotaNoticePrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  meter: "div",
  reset: "p",
  description: "div",
  actions: "div",
  upgrade: "button",
  dismiss: "button",
});

export { default as QuotaNotice } from "./QuotaNotice.svelte";
/** The bare root, for arranging the parts yourself. */
export const QuotaNoticeRoot = parts.Root;
export const QuotaNoticeIcon = parts.Icon;
export const QuotaNoticeDescription = parts.Description;
export const QuotaNoticeActions = parts.Actions;
export const QuotaNoticeDismiss = parts.Dismiss;
export { default as QuotaNoticeMeter } from "./QuotaNoticeMeter.svelte";
export { default as QuotaNoticeReset } from "./QuotaNoticeReset.svelte";
export { default as QuotaNoticeTitle } from "./QuotaNoticeTitle.svelte";
export { default as QuotaNoticeUpgrade } from "./QuotaNoticeUpgrade.svelte";
