import type { FlowDirection, MotionMode } from "@kind-ui/agent-ui/core";
import { defineFlowGraph } from "../../../../src/web/flow-graph.js";
import { advanced, type FlowGraphHost, flowEdges, flowNodes } from "../../shared/flow-graph.js";

const page =
  ({ direction, motion }: { direction?: FlowDirection; motion?: MotionMode } = {}) =>
  (root: HTMLElement) => {
    defineFlowGraph();
    const container = document.createElement("div");
    container.className = "w-[36rem] p-6";
    const element = document.createElement("kind-flow-graph");
    element.id = "flow";
    element.label = "Refund flow";
    if (direction) element.direction = direction;
    if (motion) element.motion = motion;
    container.append(element);
    root.append(container);
    element.nodes = flowNodes;
    element.edges = flowEdges;
    const host: FlowGraphHost = {
      changes: [],
      advance: () => {
        element.nodes = advanced(element.nodes ?? []);
      },
    };
    element.addEventListener("nodeselect", (event) => {
      const { value, reason, source } = event.detail;
      host.changes.push({ value, reason, source });
    });
    Object.assign(window, { kindHost: host });
  };

export const cases = { all: page(), down: page({ direction: "down" }), reduced: page({ motion: "reduced" }) };
