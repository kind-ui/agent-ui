import type { FlowEdge, FlowNode } from "@kind-ui/agent-ui";

export const flowNodes: FlowNode[] = [
  { id: "router", label: "Router", kind: "agent", status: "complete", description: "Triages requests" },
  { id: "search", label: "Search docs", kind: "tool", status: "complete" },
  { id: "billing", label: "Billing", kind: "agent", status: "running" },
  { id: "refund", label: "Issue refund", kind: "tool", status: "pending" },
  { id: "approver", label: "Finance lead", kind: "person", status: "pending" },
];

export const flowEdges: FlowEdge[] = [
  { id: "router-search", from: "router", to: "search", status: "complete" },
  { id: "router-billing", from: "router", to: "billing", label: "refund request", status: "running" },
  { id: "billing-refund", from: "billing", to: "refund" },
  { id: "billing-approver", from: "billing", to: "approver", label: "approval" },
];

/** Billing finished and the refund started: statuses change, the graph's shape doesn't. */
export const advanced = (nodes: FlowNode[]): FlowNode[] =>
  nodes.map((node) =>
    node.id === "billing"
      ? { ...node, status: "complete" }
      : node.id === "refund"
        ? { ...node, status: "running" }
        : node,
  );

export type FlowGraphHost = {
  changes: { value: string | null; reason: string; source?: string | undefined }[];
  advance(): void;
};
