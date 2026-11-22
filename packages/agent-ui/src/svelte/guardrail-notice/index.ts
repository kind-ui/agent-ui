import { guardrailNoticePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/svelte/primitive";

export const parts = createParts(guardrailNoticePrimitive, {
  root: "div",
  icon: "span",
  title: "p",
  reason: "p",
  "detail-trigger": "button",
  detail: "div",
  description: "div",
  actions: "div",
  dismiss: "button",
});

export { default as GuardrailNotice } from "./GuardrailNotice.svelte";
/** The bare root, for arranging the parts yourself. */
export const GuardrailNoticeRoot = parts.Root;
export const GuardrailNoticeIcon = parts.Icon;
export const GuardrailNoticeDescription = parts.Description;
export const GuardrailNoticeActions = parts.Actions;
export const GuardrailNoticeDismiss = parts.Dismiss;
export { default as GuardrailNoticeDetail } from "./GuardrailNoticeDetail.svelte";
export { default as GuardrailNoticeDetailTrigger } from "./GuardrailNoticeDetailTrigger.svelte";
export { default as GuardrailNoticeReason } from "./GuardrailNoticeReason.svelte";
export { default as GuardrailNoticeTitle } from "./GuardrailNoticeTitle.svelte";
