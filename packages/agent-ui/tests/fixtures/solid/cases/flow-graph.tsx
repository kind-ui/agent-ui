import type { FlowDirection, MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, flush, onSettled } from "solid-js";
import { FlowGraph } from "../../../../src/solid/flow-graph.js";
import { expose } from "../../shared/expose.js";
import { advanced, type FlowGraphHost, flowEdges, flowNodes } from "../../shared/flow-graph.js";

const changes: FlowGraphHost["changes"] = [];

function Page(props: { direction?: FlowDirection; motion?: MotionMode }) {
  const [nodes, setNodes] = createSignal(flowNodes);
  onSettled(() => {
    const host: FlowGraphHost = {
      changes,
      advance: () => {
        setNodes(advanced);
        flush();
      },
    };
    expose({ kindHost: host });
  });
  return (
    <div class="w-[36rem] p-6">
      <FlowGraph
        id="flow"
        label="Refund flow"
        nodes={nodes()}
        edges={flowEdges}
        direction={props.direction}
        motion={props.motion}
        onValueChange={(value, { reason, source }) => changes.push({ value, reason, source })}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  down: () => <Page direction="down" />,
  reduced: () => <Page motion="reduced" />,
};
