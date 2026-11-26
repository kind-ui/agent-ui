<script lang="ts">
  import { FlowGraph } from "../components/ui/svelte/flow-graph/index.js";
</script>

<FlowGraph
  label="Handoffs"
  nodes={[
    { id: "router", label: "Router", kind: "agent", status: "complete" },
    { id: "billing", label: "Billing", kind: "agent", status: "running" },
  ]}
  edges={[{ id: "e", from: "router", to: "billing" }]}
/>
