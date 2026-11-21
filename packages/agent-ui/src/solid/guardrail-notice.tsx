import { guardrailNoticePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit } from "solid-js";

const parts = createParts(guardrailNoticePrimitive, {
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

export type GuardrailNoticeProps = Omit<ComponentProps<typeof parts.Root>, "children"> & {
  /** More text under the reason. */
  children?: JSX.Element;
  /** Buttons that act on the notice, like "Rephrase". */
  actions?: JSX.Element;
};

/**
 * A notice that a guardrail blocked or filtered content: its mark and title, the `reason`, "Why?" with the
 * `detail` while there is one, any `children`, then `actions` and Dismiss while `onDismiss` is set. To arrange the parts yourself,
 * use `GuardrailNoticeRoot`.
 */
export function GuardrailNotice(props: GuardrailNoticeProps) {
  const rest = omit(props, "children", "actions");
  return (
    <parts.Root {...rest}>
      <GuardrailNoticeIcon />
      <GuardrailNoticeTitle />
      <GuardrailNoticeReason />
      <GuardrailNoticeDetailTrigger />
      <GuardrailNoticeDetail />
      {(() => {
        const children = props.children;
        return children === undefined ? null : (
          <GuardrailNoticeDescription>{children}</GuardrailNoticeDescription>
        );
      })()}
      <GuardrailNoticeActions>{props.actions}</GuardrailNoticeActions>
      <GuardrailNoticeDismiss />
    </parts.Root>
  );
}

/** The bare root, for arranging the parts yourself. */
export const GuardrailNoticeRoot = parts.Root;
export const GuardrailNoticeIcon = parts.Icon;
export const GuardrailNoticeDescription = parts.Description;
export const GuardrailNoticeActions = parts.Actions;
export const GuardrailNoticeDismiss = parts.Dismiss;

export type GuardrailNoticeTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, else "Response blocked" or "Response filtered", unless you pass children. */
export function GuardrailNoticeTitle(props: GuardrailNoticeTitleProps) {
  return <parts.Title {...props}>{props.children ?? ((state) => state.label)}</parts.Title>;
}

export type GuardrailNoticeReasonProps = ComponentProps<typeof parts.Reason>;

/** The `reason`, unless you pass children. Rendered only with a `reason`. */
export function GuardrailNoticeReason(props: GuardrailNoticeReasonProps) {
  return <parts.Reason {...props}>{props.children ?? ((state) => state.reason)}</parts.Reason>;
}

export type GuardrailNoticeDetailTriggerProps = ComponentProps<typeof parts.DetailTrigger>;

/** Shows and hides the detail. Reads "Why?" unless you pass children. Rendered only with a `detail`. */
export function GuardrailNoticeDetailTrigger(props: GuardrailNoticeDetailTriggerProps) {
  return <parts.DetailTrigger {...props}>{props.children ?? "Why?"}</parts.DetailTrigger>;
}

export type GuardrailNoticeDetailProps = ComponentProps<typeof parts.Detail>;

/** The `detail`, unless you pass children. Rendered only with a `detail`; find in page reaches it while hidden. */
export function GuardrailNoticeDetail(props: GuardrailNoticeDetailProps) {
  return <parts.Detail {...props}>{props.children ?? ((state) => <p>{state.detail}</p>)}</parts.Detail>;
}
