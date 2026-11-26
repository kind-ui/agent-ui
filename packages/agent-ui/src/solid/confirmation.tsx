import { codeSpans, confirmationPrimitive, WORDS } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
import { KindTextarea } from "./internal/textarea.js";

const parts = createParts(confirmationPrimitive, {
  root: "div",
  title: "div",
  meta: "span",
  risk: "div",
  "risk-icon": "span",
  reason: "div",
  choices: "div",
  approve: "button",
  always: "button",
  deny: "button",
  cancel: "button",
  error: "span",
  detail: "div",
  outcome: "div",
  "outcome-icon": "span",
});

export type ConfirmationProps = ComponentProps<typeof parts.Root>;

/**
 * Asks a person to approve or deny a request, then shows what was decided. Only the choices the host supplies
 * (`onDeny`, `onAlwaysAllow`, `onApprove`) render, in that order. Any `children` replace the default parts.
 */
export function Confirmation(props: ConfirmationProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const ConfirmationChoices = parts.Choices;
export const ConfirmationOutcomeIcon = parts.OutcomeIcon;
export const ConfirmationRiskIcon = parts.RiskIcon;

// Text with its backticks as `code`.
function Code(props: { text: string }) {
  return (
    <For each={codeSpans(props.text)} keyed={false}>
      {(piece, index) => (index % 2 ? <code>{piece()}</code> : piece())}
    </For>
  );
}

export type ConfirmationTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Rendered only while `label` is set, and hidden inside a Tool. */
export function ConfirmationTitle(props: ConfirmationTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => <Code text={state.label} />)}
    </parts.Title>
  );
}

export type ConfirmationMetaProps = ComponentProps<typeof parts.Meta>;

/** "Sending decision", else the deadline ("Decide in 4 min", then "Expired"), unless you pass children. */
export function ConfirmationMeta(props: ConfirmationMetaProps) {
  return (
    <parts.Meta {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => state.text)}
    </parts.Meta>
  );
}

export type ConfirmationRiskProps = ComponentProps<typeof parts.Risk>;

/** The `riskText` after a warning mark, unless you pass children. Rendered only while `riskText` is set. */
export function ConfirmationRisk(props: ConfirmationRiskProps) {
  return (
    <parts.Risk {...omit(props, "children")}>
      {props.children ??
        ((state: { text: string }) => (
          <>
            <ConfirmationRiskIcon />
            <span>
              <Code text={state.text} />
            </span>
          </>
        ))}
    </parts.Risk>
  );
}

export type ConfirmationReasonProps = ComponentProps<typeof parts.Reason>;

/**
 * A box for the reason Deny sends, unless you pass children. Rendered with the `reason` option, once a person's Deny
 * opens it.
 */
export function ConfirmationReason(props: ConfirmationReasonProps) {
  return (
    <parts.Reason {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <KindTextarea
            controller={state.controller}
            readonly={state.readOnly}
            aria-label="Reason for denying"
            placeholder="Add a reason (optional)"
            rows={2}
          />
        ))}
    </parts.Reason>
  );
}

export type ConfirmationApproveProps = ComponentProps<typeof parts.Approve>;

/** Calls `onApprove`. Reads the `approveLabel` unless you pass children. Rendered only while `onApprove` is set. */
export function ConfirmationApprove(props: ConfirmationApproveProps) {
  return <parts.Approve {...omit(props, "children")}>{props.children ?? withPendingMark}</parts.Approve>;
}

export type ConfirmationAlwaysProps = ComponentProps<typeof parts.Always>;

/**
 * Calls `onAlwaysAllow`, which approves and asks the host to remember. Reads the `alwaysLabel` and `alwaysTarget`
 * unless you pass children. Rendered only while `onAlwaysAllow` is set and `risk` isn't `"danger"`.
 */
export function ConfirmationAlways(props: ConfirmationAlwaysProps) {
  return <parts.Always {...omit(props, "children")}>{props.children ?? withPendingMark}</parts.Always>;
}

export type ConfirmationDenyProps = ComponentProps<typeof parts.Deny>;

/**
 * Calls `onDeny`. With `reason`, a person's first press opens the reason box instead. Reads the `denyLabel` unless
 * you pass children. Rendered only while `onDeny` is set.
 */
export function ConfirmationDeny(props: ConfirmationDenyProps) {
  return <parts.Deny {...omit(props, "children")}>{props.children ?? withPendingMark}</parts.Deny>;
}

export type ConfirmationCancelProps = ComponentProps<typeof parts.Cancel>;

/** Closes the reason box without deciding. Reads "Cancel" unless you pass children. Rendered while the box is open. */
export function ConfirmationCancel(props: ConfirmationCancelProps) {
  return <parts.Cancel {...omit(props, "children")}>{props.children ?? "Cancel"}</parts.Cancel>;
}

export type ConfirmationErrorProps = ComponentProps<typeof parts.Error>;

/** "Decision not sent. Try again." while the host reports `submit-failed`, unless you pass children. */
export function ConfirmationError(props: ConfirmationErrorProps) {
  return <parts.Error {...omit(props, "children")}>{props.children ?? WORDS.notSentRetry}</parts.Error>;
}

export type ConfirmationDetailProps = ComponentProps<typeof parts.Detail>;

/** The `alwaysDetail`, unless you pass children. Rendered under the choices while Always allow shows. */
export function ConfirmationDetail(props: ConfirmationDetailProps) {
  return (
    <parts.Detail {...omit(props, "children")}>
      {props.children ?? ((state: { text: string }) => <Code text={state.text} />)}
    </parts.Detail>
  );
}

export type ConfirmationOutcomeProps = ComponentProps<typeof parts.Outcome>;

/** Where the request stands, like "Approved", with the denial's reason, unless you pass children. */
export function ConfirmationOutcome(props: ConfirmationOutcomeProps) {
  return (
    <parts.Outcome {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <>
            <ConfirmationOutcomeIcon />
            <span data-confirmation-label="">
              <Code text={state.label} />
            </span>{" "}
            <Show when={state.reason}>
              <span data-confirmation-reason="">{state.reason}</span>
            </Show>
          </>
        ))}
    </parts.Outcome>
  );
}

// The mark shows only while the button's call is pending (controls.css).
const withPendingMark = (state: { label: string }): JSX.Element => (
  <>
    <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
    <Code text={state.label} />
  </>
);

function DefaultParts() {
  return (
    <>
      <ConfirmationTitle />
      <ConfirmationMeta />
      <ConfirmationRisk />
      <ConfirmationReason />
      <ConfirmationChoices>
        <ConfirmationCancel />
        <ConfirmationDeny />
        <ConfirmationAlways />
        <ConfirmationApprove />
        <ConfirmationError />
      </ConfirmationChoices>
      <ConfirmationDetail />
      <ConfirmationOutcome />
    </>
  );
}
