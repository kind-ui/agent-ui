import {
  type ConfirmationReasonState,
  codeSpans,
  confirmationPrimitive,
  WORDS,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";
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

// A part whose default slot falls back to `fallback`, as React's default `children` do.
const withDefault = <State, Part extends Component = Component>(
  part: Part,
  name: string,
  fallback: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part as Component, attrs, { ...slots, default: slots.default ?? (fallback as Slot) });
    },
  }) as unknown as Part;

/** Text with its backticks as `code`. */
export const withCode = (text: string) =>
  codeSpans(text).map((piece, index) => (index % 2 ? h("code", piece) : piece));

// The mark shows only while the button's call is pending (controls.css).
const withPendingMark = ({ state }: { state: { label: string } }) => [
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  }),
  ...withCode(state.label),
];

export const ConfirmationChoices = parts.Choices;
export const ConfirmationOutcomeIcon = parts.OutcomeIcon;
export const ConfirmationRiskIcon = parts.RiskIcon;

/** The `label`, unless you fill the slot. Rendered only while `label` is set, and hidden inside a Tool. */
export const ConfirmationTitle = withDefault<{ label: string }>(
  parts.Title,
  "ConfirmationTitle",
  ({ state }) => withCode(state.label),
);

/** "Sending decision", else the deadline ("Decide in 4 min", then "Expired"), unless you fill the slot. */
export const ConfirmationMeta = withDefault<{ text: string }>(
  parts.Meta,
  "ConfirmationMeta",
  ({ state }) => state.text,
);

/** The `riskText` after a warning mark, unless you fill the slot. Rendered only while `riskText` is set. */
export const ConfirmationRisk = withDefault<{ text: string }>(parts.Risk, "ConfirmationRisk", ({ state }) => [
  h(ConfirmationRiskIcon),
  h("span", withCode(state.text)),
]);

/**
 * A box for the reason Deny sends, unless you fill the slot. Rendered with the `reason` option, once a person's Deny
 * opens it.
 */
export const ConfirmationReason = withDefault<ConfirmationReasonState>(
  parts.Reason,
  "ConfirmationReason",
  ({ state }) =>
    h(KindTextarea, {
      controller: state.controller,
      readOnly: state.readOnly,
      "aria-label": "Reason for denying",
      placeholder: "Add a reason (optional)",
      rows: 2,
    }),
);

/** Calls `onApprove`. Reads the `approveLabel` unless you fill the slot. Rendered only while `onApprove` is set. */
export const ConfirmationApprove = withDefault(parts.Approve, "ConfirmationApprove", withPendingMark);

/**
 * Calls `onAlwaysAllow`, which approves and asks the host to remember. Reads the `alwaysLabel` and `alwaysTarget`
 * unless you fill the slot. Rendered only while `onAlwaysAllow` is set and `risk` isn't `"danger"`.
 */
export const ConfirmationAlways = withDefault(parts.Always, "ConfirmationAlways", withPendingMark);

/**
 * Calls `onDeny`. With `reason`, a person's first press opens the reason box instead. Reads the `denyLabel` unless
 * you fill the slot. Rendered only while `onDeny` is set.
 */
export const ConfirmationDeny = withDefault(parts.Deny, "ConfirmationDeny", withPendingMark);

/** Closes the reason box without deciding. Reads "Cancel" unless you fill the slot. Rendered while the box is open. */
export const ConfirmationCancel = withDefault(parts.Cancel, "ConfirmationCancel", () => "Cancel");

/** "Decision not sent. Try again." while the host reports `submit-failed`, unless you fill the slot. */
export const ConfirmationError = withDefault(parts.Error, "ConfirmationError", () => WORDS.notSentRetry);

/** The `alwaysDetail`, unless you fill the slot. Rendered under the choices while Always allow shows. */
export const ConfirmationDetail = withDefault<{ text: string }>(
  parts.Detail,
  "ConfirmationDetail",
  ({ state }) => withCode(state.text),
);

/** Where the request stands, like "Approved", with the denial's reason, unless you fill the slot. */
export const ConfirmationOutcome = withDefault<{ label: string; reason: string | undefined }>(
  parts.Outcome,
  "ConfirmationOutcome",
  ({ state }) => [
    h(ConfirmationOutcomeIcon),
    h("span", { "data-confirmation-label": "" }, withCode(state.label)),
    " ",
    state.reason ? h("span", { "data-confirmation-reason": "" }, state.reason) : null,
  ],
);

const defaultParts = () => [
  h(ConfirmationTitle),
  h(ConfirmationMeta),
  h(ConfirmationRisk),
  h(ConfirmationReason),
  h(ConfirmationChoices, null, () => [
    h(ConfirmationCancel),
    h(ConfirmationDeny),
    h(ConfirmationAlways),
    h(ConfirmationApprove),
    h(ConfirmationError),
  ]),
  h(ConfirmationDetail),
  h(ConfirmationOutcome),
];

/**
 * Asks a person to approve or deny a request, then shows what was decided. Only the choices the host supplies
 * (`onDeny`, `onAlwaysAllow`, `onApprove`) render, in that order. A default slot replaces the default parts.
 */
export const Confirmation = withDefault(parts.Root, "Confirmation", defaultParts);
