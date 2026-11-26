import { FlowGraph } from "../components/ui/solid/flow-graph.js";

export default function FlowGraphItem() {
  return (
    <FlowGraph
      label="Flow"
      nodes={[
        { id: "router", label: "Router", kind: "agent", status: "complete" },
        { id: "billing", label: "Billing", kind: "agent", status: "running" },
      ]}
      edges={[{ id: "router-billing", from: "router", to: "billing" }]}
    />
  );
}
