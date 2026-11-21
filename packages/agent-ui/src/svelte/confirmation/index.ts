import type { ComponentProps } from "svelte";
import Confirmation from "./Confirmation.svelte";
import ConfirmationApprove from "./ConfirmationApprove.svelte";
import ConfirmationCancel from "./ConfirmationCancel.svelte";
import ConfirmationDeny from "./ConfirmationDeny.svelte";
import ConfirmationError from "./ConfirmationError.svelte";
import ConfirmationOutcome from "./ConfirmationOutcome.svelte";
import ConfirmationReason from "./ConfirmationReason.svelte";
import ConfirmationTitle from "./ConfirmationTitle.svelte";
import { parts } from "./parts.js";

export {
  Confirmation,
  ConfirmationApprove,
  ConfirmationCancel,
  ConfirmationDeny,
  ConfirmationError,
  ConfirmationOutcome,
  ConfirmationReason,
  ConfirmationTitle,
};
export const ConfirmationChoices = parts.Choices;
export const ConfirmationOutcomeIcon = parts.OutcomeIcon;

export type ConfirmationProps = ComponentProps<typeof Confirmation>;
export type ConfirmationTitleProps = ComponentProps<typeof ConfirmationTitle>;
export type ConfirmationReasonProps = ComponentProps<typeof ConfirmationReason>;
export type ConfirmationApproveProps = ComponentProps<typeof ConfirmationApprove>;
export type ConfirmationDenyProps = ComponentProps<typeof ConfirmationDeny>;
export type ConfirmationCancelProps = ComponentProps<typeof ConfirmationCancel>;
export type ConfirmationErrorProps = ComponentProps<typeof ConfirmationError>;
export type ConfirmationOutcomeProps = ComponentProps<typeof ConfirmationOutcome>;
