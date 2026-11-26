import { type FlowEdgeEntry, flowGraphPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNode } from "vue";

const parts = createParts(flowGraphPrimitive, {
  root: "div",
  pane: "div",
  world: "div",
  edges: "svg",
  nodes: "div",
  node: "button",
  "node-status": "span",
  "node-label": "span",
  "node-detail": "span",
  "node-description": "span",
  controls: "div",
  "zoom-in": "button",
  "zoom-out": "button",
  fit: "button",
});

// Slot state is a proxy that answers reads, so fallbacks read each key they need.
type PartState = {
  paths: FlowEdgeEntry[];
  ids: string[];
  label: string;
  detail: string;
  description: string;
};

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component>(part: C, name: string, fallback: (state: PartState) => unknown) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill });
    },
  }) as unknown as C;
}

export const FlowGraphNodeStatus = parts.NodeStatus;
export const FlowGraphZoomIn = parts.ZoomIn;
export const FlowGraphZoomOut = parts.ZoomOut;
export const FlowGraphFit = parts.Fit;

/** The node's `label`, unless you fill the default slot. */
export const FlowGraphNodeLabel = withDefault(parts.NodeLabel, "FlowGraphNodeLabel", (state) => state.label);

/** The node's kind and status, like "Agent · Running", unless you fill the default slot. */
export const FlowGraphNodeDetail = withDefault(
  parts.NodeDetail,
  "FlowGraphNodeDetail",
  (state) => state.detail,
);

/** Hidden: the node's `description` and its edges in words, which describe the node to screen readers. */
export const FlowGraphNodeDescription = withDefault(
  parts.NodeDescription,
  "FlowGraphNodeDescription",
  (state) => state.description,
);

/** The node whose `id` is `value`. Without a default slot, it shows its status mark, label, kind and status. */
export const FlowGraphNode = withDefault(parts.Node, "FlowGraphNode", () => [
  h(FlowGraphNodeStatus),
  h(FlowGraphNodeLabel),
  " ",
  h(FlowGraphNodeDetail),
  h(FlowGraphNodeDescription),
]);

/** One SVG drawing every edge, unless you fill the default slot. */
export const FlowGraphEdges = withDefault(parts.Edges, "FlowGraphEdges", (state) =>
  state.paths.map((path) => h("path", { key: path.id, d: path.d, "data-status": path.status })),
);

/** A node for each of the `nodes`, unless you fill the default slot. */
export const FlowGraphNodes = withDefault(parts.Nodes, "FlowGraphNodes", (state) =>
  state.ids.map((id) => h(FlowGraphNode, { key: id, value: id })),
);

/** Everything that pans and zooms: the edges and the nodes, unless you fill the default slot. */
export const FlowGraphWorld = withDefault(parts.World, "FlowGraphWorld", () => [
  h(FlowGraphEdges),
  h(FlowGraphNodes),
]);

/** The scroll pane find in page scrolls, which pans the graph. Holds the world unless you fill the default slot. */
export const FlowGraphPane = withDefault(parts.Pane, "FlowGraphPane", () => h(FlowGraphWorld));

/** Zoom in, Zoom out and Fit, unless you fill the default slot. */
export const FlowGraphControls = withDefault(parts.Controls, "FlowGraphControls", () => [
  h(FlowGraphZoomIn),
  h(FlowGraphZoomOut),
  h(FlowGraphFit),
]);

/**
 * A read-only graph of agents, tools and people and the handoffs between them, laid out by dagre, that pans and
 * zooms. A default slot replaces the default pane and controls.
 */
export const FlowGraph = withDefault(parts.Root, "FlowGraph", () => [h(FlowGraphPane), h(FlowGraphControls)]);
