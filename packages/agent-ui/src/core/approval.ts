import type { Approval } from "../types/index.js";

/** Names one request: a replaced request keeps its `approvalId` and gets a new `generation`. */
export const approvalKey = (approval: Approval): string => `${approval.approvalId}:${approval.generation}`;

/** Whether a person can decide the approval: it's requested, or its decision wasn't sent. */
export const isActionable = (approval?: Approval): boolean =>
  approval?.state === "requested" || approval?.state === "submit-failed";

const PENDING_APPROVAL: Partial<Record<Approval["state"], string>> = {
  requested: "Waiting for approval",
  submitting: "Sending decision",
  "submit-failed": "Decision not sent",
};

/** The words for where an approval stands, or `undefined` without one or before its decision is known. */
export const approvalLabel = (approval?: Approval): string | undefined => {
  if (!approval) return undefined;
  const pending = PENDING_APPROVAL[approval.state];
  if (pending || !approval.decision) return pending;
  const decision = approval.decision.approved ? "Approved" : "Denied";
  return approval.state === "auto" ? `${decision} automatically` : decision;
};
