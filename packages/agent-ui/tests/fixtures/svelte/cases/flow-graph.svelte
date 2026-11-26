<script module lang="ts">
  export const variants = ["all", "down", "reduced"];
</script>

<script lang="ts">
  import type { FlowDirection, FlowGraphValueChangeReason, MotionMode } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { flushSync } from "svelte";
  import { FlowGraph } from "../../../../src/svelte/flow-graph/index.js";
  import { expose } from "../../shared/expose.js";
  import { advanced, type FlowGraphHost, flowEdges, flowNodes } from "../../shared/flow-graph.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let nodes = $state.raw(flowNodes);
  const changes: FlowGraphHost["changes"] = [];
  const direction: FlowDirection | undefined = $derived(variant === "down" ? "down" : undefined);
  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  const host: FlowGraphHost = { changes, advance: () => flushSync(() => (nodes = advanced(nodes))) };
  expose({ kindHost: host });

  const record = (value: string | null, { reason, source }: ChangeDetails<FlowGraphValueChangeReason>) =>
    changes.push({ value, reason, source });
</script>

<div class="w-[36rem] p-6">
  <FlowGraph
    id="flow"
    label="Refund flow"
    {nodes}
    edges={flowEdges}
    {direction}
    {motion}
    onValueChange={record}
  />
</div>
