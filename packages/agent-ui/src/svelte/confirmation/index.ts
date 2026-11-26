import type { ComponentProps } from "svelte";
import Confirmation from "./Confirmation.svelte";
import ConfirmationAlways from "./ConfirmationAlways.svelte";
import ConfirmationApprove from "./ConfirmationApprove.svelte";
import ConfirmationCancel from "./ConfirmationCancel.svelte";
import ConfirmationDeny from "./ConfirmationDeny.svelte";
import ConfirmationDetail from "./ConfirmationDetail.svelte";
import ConfirmationError from "./ConfirmationError.svelte";
import ConfirmationMeta from "./ConfirmationMeta.svelte";
import ConfirmationOutcome from "./ConfirmationOutcome.svelte";
import ConfirmationReason from "./ConfirmationReason.svelte";
import ConfirmationRisk from "./ConfirmationRisk.svelte";
import ConfirmationTitle from "./ConfirmationTitle.svelte";
import { parts } from "./parts.js";

export {
  Confirmation,
  ConfirmationAlways,
  ConfirmationApprove,
  ConfirmationCancel,
  ConfirmationDeny,
  ConfirmationDetail,
  ConfirmationError,
  ConfirmationMeta,
  ConfirmationOutcome,
  ConfirmationReason,
  ConfirmationRisk,
  ConfirmationTitle,
};
export const ConfirmationChoices = parts.Choices;
export const ConfirmationOutcomeIcon = parts.OutcomeIcon;
export const ConfirmationRiskIcon = parts.RiskIcon;

export type ConfirmationProps = ComponentProps<typeof Confirmation>;
export type ConfirmationTitleProps = ComponentProps<typeof ConfirmationTitle>;
export type ConfirmationMetaProps = ComponentProps<typeof ConfirmationMeta>;
export type ConfirmationRiskProps = ComponentProps<typeof ConfirmationRisk>;
export type ConfirmationReasonProps = ComponentProps<typeof ConfirmationReason>;
export type ConfirmationApproveProps = ComponentProps<typeof ConfirmationApprove>;
export type ConfirmationAlwaysProps = ComponentProps<typeof ConfirmationAlways>;
export type ConfirmationDenyProps = ComponentProps<typeof ConfirmationDeny>;
export type ConfirmationCancelProps = ComponentProps<typeof ConfirmationCancel>;
export type ConfirmationErrorProps = ComponentProps<typeof ConfirmationError>;
export type ConfirmationDetailProps = ComponentProps<typeof ConfirmationDetail>;
export type ConfirmationOutcomeProps = ComponentProps<typeof ConfirmationOutcome>;
