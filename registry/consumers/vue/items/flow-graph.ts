import { h } from "vue";
import { FlowGraph } from "../components/ui/vue/flow-graph.js";

export default () =>
  h(FlowGraph, {
    label: "Flow",
    nodes: [
      { id: "router", label: "Router", kind: "agent", status: "complete" },
      { id: "search", label: "Search docs", kind: "tool", status: "running" },
    ],
    edges: [{ id: "router-search", from: "router", to: "search" }],
  });
