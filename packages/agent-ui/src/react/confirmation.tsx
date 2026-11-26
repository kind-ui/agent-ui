"use client";

import { codeSpans, confirmationPrimitive, WORDS } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import { type ComponentProps, Fragment } from "react";
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
export function Confirmation({ children, ...props }: ConfirmationProps) {
  return <parts.Root {...props}>{children !== undefined ? children : DEFAULT_PARTS}</parts.Root>;
}

export const ConfirmationChoices = parts.Choices;
export const ConfirmationOutcomeIcon = parts.OutcomeIcon;
export const ConfirmationRiskIcon = parts.RiskIcon;

/** Text with its backticks as `code`. */
export const withCode = (text: string) =>
  codeSpans(text).map((piece, index) =>
    // biome-ignore lint/suspicious/noArrayIndexKey: the pieces never move.
    index % 2 ? <code key={index}>{piece}</code> : <Fragment key={index}>{piece}</Fragment>,
  );

export type ConfirmationTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Rendered only while `label` is set, and hidden inside a Tool. */
export function ConfirmationTitle({
  children = ({ label }) => withCode(label),
  ...props
}: ConfirmationTitleProps) {
  return <parts.Title {...props}>{children}</parts.Title>;
}

export type ConfirmationMetaProps = ComponentProps<typeof parts.Meta>;

/** "Sending decision", else the deadline ("Decide in 4 min", then "Expired"), unless you pass children. */
export function ConfirmationMeta({ children = ({ text }) => text, ...props }: ConfirmationMetaProps) {
  return <parts.Meta {...props}>{children}</parts.Meta>;
}

export type ConfirmationRiskProps = ComponentProps<typeof parts.Risk>;

/** The `riskText` after a warning mark, unless you pass children. Rendered only while `riskText` is set. */
export function ConfirmationRisk({
  children = ({ text }) => (
    <>
      <ConfirmationRiskIcon />
      <span>{withCode(text)}</span>
    </>
  ),
  ...props
}: ConfirmationRiskProps) {
  return <parts.Risk {...props}>{children}</parts.Risk>;
}

export type ConfirmationReasonProps = ComponentProps<typeof parts.Reason>;

/**
 * A box for the reason Deny sends, unless you pass children. Rendered with the `reason` option, once a person's Deny
 * opens it.
 */
export function ConfirmationReason({
  children = ({ controller, readOnly }) => (
    <KindTextarea
      controller={controller}
      readOnly={readOnly}
      aria-label="Reason for denying"
      placeholder="Add a reason (optional)"
      rows={2}
    />
  ),
  ...props
}: ConfirmationReasonProps) {
  return <parts.Reason {...props}>{children}</parts.Reason>;
}

export type ConfirmationApproveProps = ComponentProps<typeof parts.Approve>;

/** Calls `onApprove`. Reads the `approveLabel` unless you pass children. Rendered only while `onApprove` is set. */
export function ConfirmationApprove({ children = withPendingMark, ...props }: ConfirmationApproveProps) {
  return <parts.Approve {...props}>{children}</parts.Approve>;
}

export type ConfirmationAlwaysProps = ComponentProps<typeof parts.Always>;

/**
 * Calls `onAlwaysAllow`, which approves and asks the host to remember. Reads the `alwaysLabel` and `alwaysTarget`
 * unless you pass children. Rendered only while `onAlwaysAllow` is set and `risk` isn't `"danger"`.
 */
export function ConfirmationAlways({ children = withPendingMark, ...props }: ConfirmationAlwaysProps) {
  return <parts.Always {...props}>{children}</parts.Always>;
}

export type ConfirmationDenyProps = ComponentProps<typeof parts.Deny>;

/**
 * Calls `onDeny`. With `reason`, a person's first press opens the reason box instead. Reads the `denyLabel` unless
 * you pass children. Rendered only while `onDeny` is set.
 */
export function ConfirmationDeny({ children = withPendingMark, ...props }: ConfirmationDenyProps) {
  return <parts.Deny {...props}>{children}</parts.Deny>;
}

export type ConfirmationCancelProps = ComponentProps<typeof parts.Cancel>;

/** Closes the reason box without deciding. Reads "Cancel" unless you pass children. Rendered while the box is open. */
export function ConfirmationCancel({ children = "Cancel", ...props }: ConfirmationCancelProps) {
  return <parts.Cancel {...props}>{children}</parts.Cancel>;
}

export type ConfirmationErrorProps = ComponentProps<typeof parts.Error>;

/** "Decision not sent. Try again." while the host reports `submit-failed`, unless you pass children. */
export function ConfirmationError({ children = WORDS.notSentRetry, ...props }: ConfirmationErrorProps) {
  return <parts.Error {...props}>{children}</parts.Error>;
}

export type ConfirmationDetailProps = ComponentProps<typeof parts.Detail>;

/** The `alwaysDetail`, unless you pass children. Rendered under the choices while Always allow shows. */
export function ConfirmationDetail({
  children = ({ text }) => withCode(text),
  ...props
}: ConfirmationDetailProps) {
  return <parts.Detail {...props}>{children}</parts.Detail>;
}

export type ConfirmationOutcomeProps = ComponentProps<typeof parts.Outcome>;

/** Where the request stands, like "Approved", with the denial's reason, unless you pass children. */
export function ConfirmationOutcome({
  children = ({ label, reason }) => (
    <>
      <ConfirmationOutcomeIcon />
      <span data-confirmation-label="">{withCode(label)}</span>{" "}
      {reason ? <span data-confirmation-reason="">{reason}</span> : null}
    </>
  ),
  ...props
}: ConfirmationOutcomeProps) {
  return <parts.Outcome {...props}>{children}</parts.Outcome>;
}

// The mark shows only while the button's call is pending (controls.css).
const withPendingMark = ({ label }: { label: string }) => (
  <>
    <span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true" />
    {withCode(label)}
  </>
);

// Shared, so an update to the request doesn't render the default parts' wrappers again.
const DEFAULT_PARTS = (
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
