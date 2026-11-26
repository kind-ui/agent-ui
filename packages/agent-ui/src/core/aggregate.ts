import type { StepStatus } from "../types/index.js";

/**
 * One status for a group, its most urgent child's (Wave 7 spec §2.2): waiting, then failed, then running, then
 * pending, then stopped, then complete. A step still to start after another completed counts as running, since
 * the work is under way. An empty group is `pending`.
 */
export function aggregateStatus(statuses: readonly StepStatus[]): StepStatus {
  const has = (status: StepStatus) => statuses.includes(status);
  if (has("awaiting-input")) return "awaiting-input";
  if (has("error")) return "error";
  if (has("running")) return "running";
  if (has("pending")) return has("complete") ? "running" : "pending";
  if (has("cancelled")) return "cancelled";
  return statuses.length === 0 ? "pending" : "complete";
}
