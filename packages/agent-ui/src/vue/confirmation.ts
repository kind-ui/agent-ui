import { type ConfirmationReasonState, confirmationPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";
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

// The mark shows only while the button's call is pending (controls.css).
const withPendingMark = ({ state }: { state: { label: string } }) => [
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  }),
  state.label,
];

export const ConfirmationChoices = parts.Choices;
export const ConfirmationOutcomeIcon = parts.OutcomeIcon;

/** The `label`, unless you fill the slot. Rendered only while `label` is set, and hidden inside a Tool. */
export const ConfirmationTitle = withDefault<{ label: string }>(
  parts.Title,
  "ConfirmationTitle",
  ({ state }) => state.label,
);

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
 * Calls `onAlwaysAllow`, which approves and tells the host to remember. Reads the `alwaysLabel` unless you fill the
 * slot. Rendered only while `onAlwaysAllow` is set.
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
export const ConfirmationError = withDefault(
  parts.Error,
  "ConfirmationError",
  () => "Decision not sent. Try again.",
);

/** Where the request stands, like "Approved", with the denial's reason, unless you fill the slot. */
export const ConfirmationOutcome = withDefault<{ label: string; reason: string | undefined }>(
  parts.Outcome,
  "ConfirmationOutcome",
  ({ state }) => [
    h(ConfirmationOutcomeIcon),
    h("span", { "data-confirmation-label": "" }, state.label),
    state.reason ? h("span", { "data-confirmation-reason": "" }, state.reason) : null,
  ],
);

const defaultParts = () => [
  h(ConfirmationTitle),
  h(ConfirmationReason),
  h(ConfirmationChoices, null, () => [
    h(ConfirmationApprove),
    h(ConfirmationAlways),
    h(ConfirmationDeny),
    h(ConfirmationCancel),
    h(ConfirmationError),
  ]),
  h(ConfirmationOutcome),
];

/**
 * Asks a person to approve or deny a request, then shows what was decided. Only the choices the host supplies
 * (`onApprove`, `onAlwaysAllow`, `onDeny`) render. A default slot replaces the default parts.
 */
export const Confirmation = withDefault(parts.Root, "Confirmation", defaultParts);
