// Compiles the adapter's non-`ai` exports without importing `ai` (spec §3: `ai` is an optional peer).
import type { Approval } from "@kind-ui/agent-ui";
import { type ApprovalResponse, toApprovalResponse } from "@kind-ui/agent-ui/adapters/ai-sdk";

const approval: Approval = { approvalId: "appr-1", generation: 0, state: "requested" };
const response: ApprovalResponse = toApprovalResponse(approval, { approved: false, reason: "no" });
const id: string = response.id;
// @ts-expect-error decision.approved is required
toApprovalResponse(approval, {});

export { id };
