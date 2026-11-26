import type { Approval } from "../types/index.js";
import { WORDS } from "./words.js";

/** Names one request: a replaced request keeps its `approvalId` and gets a new `generation`. */
export const approvalKey = (approval: Approval): string => `${approval.approvalId}:${approval.generation}`;

/** Whether a person can decide the approval: it's requested, or its decision wasn't sent. */
export const isActionable = (approval?: Approval): boolean =>
  approval?.state === "requested" || approval?.state === "submit-failed";

const SETTLED = new Set<Approval["state"] | undefined>(["responded", "auto", "expired", "cancelled"]);

/** Whether a request in this state is settled: decided, expired or cancelled. */
export const isSettled = (state: Approval["state"] | undefined): boolean => SETTLED.has(state);

const PENDING_APPROVAL: Partial<Record<Approval["state"], string>> = {
  requested: WORDS.waiting,
  submitting: WORDS.sending,
  "submit-failed": WORDS.notSent,
  expired: WORDS.expired,
  cancelled: WORDS.cancelled,
};

/** What an Always allow reaches: `target` is what ("npm test"), `scope` where ("in this project"). */
export type AlwaysScope = { target?: string | undefined; scope?: string | undefined };

/**
 * The words for where an approval stands (Wave 7 spec §2.1), or `undefined` without one or before its decision is
 * known. Code is in backticks (`codeSpans`): "Always allowed `npm test` in this project". A denial's reason isn't
 * included; the outcome shows it after "Denied:".
 */
export const approvalLabel = (approval?: Approval, always: AlwaysScope = {}): string | undefined => {
  if (!approval) return undefined;
  const pending = PENDING_APPROVAL[approval.state];
  const { decision } = approval;
  if (pending || !decision) return pending;
  if (!decision.approved) {
    if (approval.state === "auto") return WORDS.deniedAutomatically;
    return decision.reason ? `${WORDS.denied}:` : WORDS.denied;
  }
  if (approval.state === "auto") return WORDS.approvedAutomatically;
  if (!decision.always) return WORDS.approved;
  const scope = decision.scope ?? always.scope;
  return [WORDS.alwaysAllowed, always.target && `\`${always.target}\``, scope].filter(Boolean).join(" ");
};

/** The status mark for where an approval stands (Wave 7 spec §2.1 Marks), as `data-status`. */
export const approvalMark = (approval?: Approval): string | undefined => {
  if (!approval) return undefined;
  switch (approval.state) {
    case "requested":
      return "awaiting-input";
    case "submitting":
      return "running";
    case "submit-failed":
      return "error";
    case "expired":
      return "expired";
    case "cancelled":
      return "cancelled";
    default:
      return approval.decision?.approved === false ? "denied" : "complete";
  }
};
