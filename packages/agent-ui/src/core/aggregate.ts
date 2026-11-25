import type { StepStatus } from "../types/index.js";

/**
 * One status for a group of steps: `awaiting-input` while any waits on a person, else `running` while any runs or
 * one is still to start after another started, else `error` if any failed, `cancelled` if all were, else `complete`.
 * `pending` while none has started, an empty group included.
 */
export function aggregateStatus(statuses: readonly StepStatus[]): StepStatus {
  if (statuses.includes("awaiting-input")) return "awaiting-input";
  if (statuses.every((status) => status === "pending")) return "pending";
  if (statuses.includes("running") || statuses.includes("pending")) return "running";
  if (statuses.includes("error")) return "error";
  if (statuses.every((status) => status === "cancelled")) return "cancelled";
  return "complete";
}
