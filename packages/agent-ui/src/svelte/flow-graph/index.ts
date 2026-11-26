import type { ComponentProps } from "svelte";
import FlowGraph from "./FlowGraph.svelte";
import FlowGraphControls from "./FlowGraphControls.svelte";
import FlowGraphEdges from "./FlowGraphEdges.svelte";
import FlowGraphNode from "./FlowGraphNode.svelte";
import FlowGraphNodeDescription from "./FlowGraphNodeDescription.svelte";
import FlowGraphNodeDetail from "./FlowGraphNodeDetail.svelte";
import FlowGraphNodeLabel from "./FlowGraphNodeLabel.svelte";
import FlowGraphNodes from "./FlowGraphNodes.svelte";
import FlowGraphPane from "./FlowGraphPane.svelte";
import FlowGraphWorld from "./FlowGraphWorld.svelte";
import { parts } from "./parts.js";

export const FlowGraphNodeStatus = parts.NodeStatus;
export const FlowGraphZoomIn = parts.ZoomIn;
export const FlowGraphZoomOut = parts.ZoomOut;
export const FlowGraphFit = parts.Fit;

export {
  FlowGraph,
  FlowGraphControls,
  FlowGraphEdges,
  FlowGraphNode,
  FlowGraphNodeDescription,
  FlowGraphNodeDetail,
  FlowGraphNodeLabel,
  FlowGraphNodes,
  FlowGraphPane,
  FlowGraphWorld,
};

export type FlowGraphProps = ComponentProps<typeof FlowGraph>;
export type FlowGraphPaneProps = ComponentProps<typeof FlowGraphPane>;
export type FlowGraphWorldProps = ComponentProps<typeof FlowGraphWorld>;
export type FlowGraphEdgesProps = ComponentProps<typeof FlowGraphEdges>;
export type FlowGraphNodesProps = ComponentProps<typeof FlowGraphNodes>;
export type FlowGraphNodeProps = ComponentProps<typeof FlowGraphNode>;
export type FlowGraphNodeLabelProps = ComponentProps<typeof FlowGraphNodeLabel>;
export type FlowGraphNodeDetailProps = ComponentProps<typeof FlowGraphNodeDetail>;
export type FlowGraphNodeDescriptionProps = ComponentProps<typeof FlowGraphNodeDescription>;
export type FlowGraphControlsProps = ComponentProps<typeof FlowGraphControls>;
