import { confirmationPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { omit, Show } from "solid-js";
import { KindTextarea } from "./internal/textarea.js";

const parts = createParts(confirmationPrimitive, {
  root: "div",
  title: "div",
  reason: "div",
  choices: "div",
  approve: "button",
  always: "button",
  deny: "button",
  cancel: "button",
  error: "span",
  outcome: "div",
  "outcome-icon": "span",
});

export type ConfirmationProps = ComponentProps<typeof parts.Root>;

/**
 * Asks a person to approve or deny a request, then shows what was decided. Only the choices the host supplies
 * (`onApprove`, `onAlwaysAllow`, `onDeny`) render. Any `children` replace the default parts.
 */
export function Confirmation(props: ConfirmationProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export const ConfirmationChoices = parts.Choices;
export const ConfirmationOutcomeIcon = parts.OutcomeIcon;

export type ConfirmationTitleProps = ComponentProps<typeof parts.Title>;

/** The `label`, unless you pass children. Rendered only while `label` is set, and hidden inside a Tool. */
export function ConfirmationTitle(props: ConfirmationTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Title>
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
 * Calls `onAlwaysAllow`, which approves and tells the host to remember. Reads the `alwaysLabel` unless you pass
 * children. Rendered only while `onAlwaysAllow` is set.
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
  return (
    <parts.Error {...omit(props, "children")}>
      {props.children ?? "Decision not sent. Try again."}
    </parts.Error>
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
            <span data-confirmation-label="">{state.label}</span>
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
    {state.label}
  </>
);

function DefaultParts() {
  return (
    <>
      <ConfirmationTitle />
      <ConfirmationReason />
      <ConfirmationChoices>
        <ConfirmationApprove />
        <ConfirmationAlways />
        <ConfirmationDeny />
        <ConfirmationCancel />
        <ConfirmationError />
      </ConfirmationChoices>
      <ConfirmationOutcome />
    </>
  );
}
