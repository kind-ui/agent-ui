import type { FlowDirection, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { FlowGraph } from "../../../../src/react/flow-graph.js";
import { advanced, type FlowGraphHost, flowEdges, flowNodes } from "../../shared/flow-graph.js";

const changes: FlowGraphHost["changes"] = [];

function Page({ direction, motion }: { direction?: FlowDirection; motion?: MotionMode }) {
  const [nodes, setNodes] = useState(flowNodes);
  useEffect(() => {
    const host: FlowGraphHost = { changes, advance: () => flushSync(() => setNodes(advanced)) };
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="w-[36rem] p-6">
      <FlowGraph
        id="flow"
        label="Refund flow"
        nodes={nodes}
        edges={flowEdges}
        direction={direction}
        motion={motion}
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
