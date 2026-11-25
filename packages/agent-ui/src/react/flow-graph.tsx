"use client";

import { flowGraphPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps } from "react";

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

export type FlowGraphProps = ComponentProps<typeof parts.Root>;

/**
 * A read-only graph of agents, tools and people and the handoffs between them, laid out by dagre, that pans and
 * zooms. Any `children` replace the default pane and controls.
 */
export function FlowGraph({ children, ...props }: FlowGraphProps) {
  return <parts.Root {...props}>{children !== undefined ? children : DEFAULT_PARTS}</parts.Root>;
}

export type FlowGraphPaneProps = ComponentProps<typeof parts.Pane>;

/** The scroll pane find in page scrolls, which pans the graph. Holds the world unless you pass children. */
export function FlowGraphPane({ children = DEFAULT_WORLD, ...props }: FlowGraphPaneProps) {
  return <parts.Pane {...props}>{children}</parts.Pane>;
}

export type FlowGraphWorldProps = ComponentProps<typeof parts.World>;

/** Everything that pans and zooms: the edges and the nodes, unless you pass children. */
export function FlowGraphWorld({ children = DEFAULT_LAYERS, ...props }: FlowGraphWorldProps) {
  return <parts.World {...props}>{children}</parts.World>;
}

export type FlowGraphEdgesProps = ComponentProps<typeof parts.Edges>;

/** One SVG drawing every edge, unless you pass children. */
export function FlowGraphEdges({
  children = ({ paths }) => paths.map((path) => <path key={path.id} d={path.d} data-status={path.status} />),
  ...props
}: FlowGraphEdgesProps) {
  return <parts.Edges {...props}>{children}</parts.Edges>;
}

export type FlowGraphNodesProps = ComponentProps<typeof parts.Nodes>;

/** A node for each of the `nodes`, unless you pass children. */
export function FlowGraphNodes({
  children = ({ ids }) => ids.map((id) => <FlowGraphNode key={id} value={id} />),
  ...props
}: FlowGraphNodesProps) {
  return <parts.Nodes {...props}>{children}</parts.Nodes>;
}

export type FlowGraphNodeProps = ComponentProps<typeof parts.Node>;

/** The node whose `id` is `value`. Without children, it shows its status mark, label and detail. */
export function FlowGraphNode({ children, ...props }: FlowGraphNodeProps) {
  return <parts.Node {...props}>{children !== undefined ? children : DEFAULT_NODE_PARTS}</parts.Node>;
}

export const FlowGraphNodeStatus = parts.NodeStatus;

export type FlowGraphNodeLabelProps = ComponentProps<typeof parts.NodeLabel>;

/** The node's `label`, unless you pass children. */
export function FlowGraphNodeLabel({ children = ({ label }) => label, ...props }: FlowGraphNodeLabelProps) {
  return <parts.NodeLabel {...props}>{children}</parts.NodeLabel>;
}

export type FlowGraphNodeDetailProps = ComponentProps<typeof parts.NodeDetail>;

/** The node's `description`, else its kind, unless you pass children. */
export function FlowGraphNodeDetail({
  children = ({ detail }) => detail,
  ...props
}: FlowGraphNodeDetailProps) {
  return <parts.NodeDetail {...props}>{children}</parts.NodeDetail>;
}

export type FlowGraphNodeDescriptionProps = ComponentProps<typeof parts.NodeDescription>;

/** Hidden: the node's `description` and its edges in words, which describe the node to screen readers. */
export function FlowGraphNodeDescription({
  children = ({ description }) => description,
  ...props
}: FlowGraphNodeDescriptionProps) {
  return <parts.NodeDescription {...props}>{children}</parts.NodeDescription>;
}

export type FlowGraphControlsProps = ComponentProps<typeof parts.Controls>;

/** Zoom in, Zoom out and Fit, unless you pass children. */
export function FlowGraphControls({ children = DEFAULT_CONTROLS, ...props }: FlowGraphControlsProps) {
  return <parts.Controls {...props}>{children}</parts.Controls>;
}

export const FlowGraphZoomIn = parts.ZoomIn;
export const FlowGraphZoomOut = parts.ZoomOut;
export const FlowGraphFit = parts.Fit;

// Shared, so a status change doesn't render the default parts' wrappers again.
const DEFAULT_NODE_PARTS = (
  <>
    <FlowGraphNodeStatus />
    <FlowGraphNodeLabel />
    <FlowGraphNodeDetail />
    <FlowGraphNodeDescription />
  </>
);

const DEFAULT_LAYERS = (
  <>
    <FlowGraphEdges />
    <FlowGraphNodes />
  </>
);

const DEFAULT_WORLD = <FlowGraphWorld />;

const DEFAULT_CONTROLS = (
  <>
    <FlowGraphZoomIn />
    <FlowGraphZoomOut />
    <FlowGraphFit />
  </>
);

const DEFAULT_PARTS = (
  <>
    <FlowGraphPane />
    <FlowGraphControls />
  </>
);
