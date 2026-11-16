import type { Approval } from "../../types/index.js";

export interface ApprovalDecision {
  approved: boolean;
  reason?: string;
}

export interface ApprovalResponse extends ApprovalDecision {
  id: string;
}

/** The argument a host passes to the SDK's `addToolApprovalResponse`. */
export function toApprovalResponse(approval: Approval, decision: ApprovalDecision): ApprovalResponse {
  const response: ApprovalResponse = { id: approval.approvalId, approved: decision.approved };
  if (decision.reason !== undefined) response.reason = decision.reason;
  return response;
}

/** The subset of an AI SDK tool approval the neutral `Approval` keeps. */
export interface SdkApproval {
  id: string;
  approved?: boolean;
  reason?: string;
  isAutomatic?: boolean;
}

// The SDK has no request generation. Opaque fields (`descriptor`, `signature`, …) carry no authority.
export function fromSdkApproval(approval: SdkApproval): Approval {
  const answered = approval.approved !== undefined;
  const mapped: Approval = {
    approvalId: approval.id,
    generation: 0,
    state: approval.isAutomatic ? "auto" : answered ? "responded" : "requested",
  };
  if (approval.approved !== undefined) {
    mapped.decision =
      approval.reason === undefined
        ? { approved: approval.approved }
        : { approved: approval.approved, reason: approval.reason };
  }
  return mapped;
}
