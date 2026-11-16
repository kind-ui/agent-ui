import type { StepStatus, ToolCall } from "../../types/index.js";

export { approvalLabel } from "../approval.js";

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
