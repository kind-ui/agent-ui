import type { Approval, StepStatus, ToolCall } from "../../types/index.js";

/** A tool call's status, from its outcome, then its approval, then its output (spec §4.3). */
export const toolStatus = (call: ToolCall): StepStatus => {
  if (call.outcome === "error") return "error";
  if (call.outcome === "denied" || call.outcome === "cancelled") return "cancelled";
  const approval = call.approval?.state;
  if (approval === "requested" || approval === "submitting" || approval === "submit-failed")
    return "awaiting-input";
  if (call.output?.state === "available") return "complete";
  return "running";
};

/** `value` as indented JSON, or as `String(value)` when it has none, like `undefined` or a cycle. */
export const toolCode = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

/** How a tool value shows: a non-empty string as markdown, anything else as code, `0`, `false` and `null` too. */
export const toolValue = (
  value: unknown,
): { kind: "markdown"; text: string } | { kind: "code"; code: string } =>
  typeof value === "string" && value !== ""
    ? { kind: "markdown", text: value }
    : { kind: "code", code: toolCode(value) };

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
