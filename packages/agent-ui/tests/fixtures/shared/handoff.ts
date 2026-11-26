import type { HandoffOptions } from "@kind-ui/agent-ui/core";

const support = { id: "support", name: "Support" };
const billing = { id: "billing", name: "Billing", description: "Refunds and invoices" };

/** Each handoff on the fixture page by id; `approval` ones wait on a decision. */
export const handoffs: Record<string, HandoffOptions & { approve?: boolean }> = {
  billing: {
    from: support,
    to: billing,
    reason: "The customer asked for a refund",
    approval: { approvalId: "billing", generation: 1, state: "requested" },
    approve: true,
  },
  person: { from: support, to: { kind: "person", name: "Dana Reyes" }, status: "accepted" },
  wait: { from: support, to: { id: "research", name: "Research" }, status: "pending" },
  declined: { from: billing, to: { id: "legal", name: "Legal" }, status: "declined" },
  done: { from: { kind: "person", name: "Sam" }, to: support, status: "complete" },
};
