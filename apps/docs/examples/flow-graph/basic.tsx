import type { FlowEdge, FlowNode } from "@kind-ui/agent-ui";
import { FlowGraph } from "@/components/ui/flow-graph";

const nodes: FlowNode[] = [
  { id: "router", label: "Router", kind: "agent", status: "complete", description: "Triages requests" },
  { id: "search", label: "Search docs", kind: "tool", status: "complete" },
  { id: "billing", label: "Billing", kind: "agent", status: "running" },
  { id: "refund", label: "Issue refund", kind: "tool", status: "pending" },
  { id: "approver", label: "Finance lead", kind: "person", status: "pending" },
];

const edges: FlowEdge[] = [
  { id: "router-search", from: "router", to: "search", status: "complete" },
  { id: "router-billing", from: "router", to: "billing", label: "refund request", status: "running" },
  { id: "billing-refund", from: "billing", to: "refund" },
  { id: "billing-approver", from: "billing", to: "approver", label: "approval" },
];

export default function FlowGraphExample() {
  return <FlowGraph label="Refund flow" nodes={nodes} edges={edges} className="w-full" />;
}
