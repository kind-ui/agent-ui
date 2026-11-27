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

const isScalar = (value: unknown) =>
  value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";

const isSmall = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const values = Object.values(value);
  return values.length > 0 && values.length <= 3 && values.every(isScalar);
};

/**
 * `value` as JSON: an object of up to three scalar values on one line (`{ "filter": "client" }`), anything else
 * indented, or `String(value)` when it has none, like `undefined` or a cycle.
 */
export const toolCode = (value: unknown): string => {
  try {
    if (isSmall(value)) {
      const pairs = Object.entries(value).map(
        ([key, item]) => `${JSON.stringify(key)}: ${JSON.stringify(item)}`,
      );
      return `{ ${pairs.join(", ")} }`;
    }
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

/**
 * A tool's name as words, for a title when the host gives none: `search_code`, `searchCode` and `search-code` read
 * "Search code".
 */
export const humanizeToolName = (name: string): string => {
  const words = name
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .split(/[\s_.\-:/]+/)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
