import { flowGraphPrimitive } from "@kind-ui/agent-ui/core/flow-graph";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit } from "solid-js";

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
export function FlowGraph(props: FlowGraphProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export type FlowGraphPaneProps = ComponentProps<typeof parts.Pane>;

/** The scroll pane find in page scrolls, which pans the graph. Holds the world unless you pass children. */
export function FlowGraphPane(props: FlowGraphPaneProps) {
  return <parts.Pane {...omit(props, "children")}>{props.children ?? <FlowGraphWorld />}</parts.Pane>;
}

export type FlowGraphWorldProps = ComponentProps<typeof parts.World>;

/** Everything that pans and zooms: the edges and the nodes, unless you pass children. */
export function FlowGraphWorld(props: FlowGraphWorldProps) {
  return <parts.World {...omit(props, "children")}>{props.children ?? <DefaultLayers />}</parts.World>;
}

export type FlowGraphEdgesProps = ComponentProps<typeof parts.Edges>;

/** One SVG drawing every edge, unless you pass children. */
export function FlowGraphEdges(props: FlowGraphEdgesProps) {
  return (
    <parts.Edges {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <For each={state.paths} keyed={(path) => path.id}>
            {(path) => <path d={path().d} data-status={path().status} />}
          </For>
        ))}
    </parts.Edges>
  );
}

export type FlowGraphNodesProps = ComponentProps<typeof parts.Nodes>;

/** A node for each of the `nodes`, unless you pass children. */
export function FlowGraphNodes(props: FlowGraphNodesProps) {
  return (
    <parts.Nodes {...omit(props, "children")}>
      {props.children ?? ((state) => <For each={state.ids}>{(id) => <FlowGraphNode value={id} />}</For>)}
    </parts.Nodes>
  );
}

export type FlowGraphNodeProps = ComponentProps<typeof parts.Node>;

/** The node whose `id` is `value`. Without children, it shows its status mark, label, kind and status. */
export function FlowGraphNode(props: FlowGraphNodeProps) {
  return <parts.Node {...omit(props, "children")}>{props.children ?? <DefaultNodeParts />}</parts.Node>;
}

export const FlowGraphNodeStatus = parts.NodeStatus;

export type FlowGraphNodeLabelProps = ComponentProps<typeof parts.NodeLabel>;

/** The node's `label`, unless you pass children. */
export function FlowGraphNodeLabel(props: FlowGraphNodeLabelProps) {
  return (
    <parts.NodeLabel {...omit(props, "children")}>
      {props.children ?? ((state) => state.label)}
    </parts.NodeLabel>
  );
}

export type FlowGraphNodeDetailProps = ComponentProps<typeof parts.NodeDetail>;

/** The node's kind and status, like "Agent · Running", unless you pass children. */
export function FlowGraphNodeDetail(props: FlowGraphNodeDetailProps) {
  return (
    <parts.NodeDetail {...omit(props, "children")}>
      {props.children ?? ((state) => state.detail)}
    </parts.NodeDetail>
  );
}

export type FlowGraphNodeDescriptionProps = ComponentProps<typeof parts.NodeDescription>;

/** Hidden: the node's `description` and its edges in words, which describe the node to screen readers. */
export function FlowGraphNodeDescription(props: FlowGraphNodeDescriptionProps) {
  return (
    <parts.NodeDescription {...omit(props, "children")}>
      {props.children ?? ((state) => state.description)}
    </parts.NodeDescription>
  );
}

export type FlowGraphControlsProps = ComponentProps<typeof parts.Controls>;

/** Zoom in, Zoom out and Fit, unless you pass children. */
export function FlowGraphControls(props: FlowGraphControlsProps) {
  return (
    <parts.Controls {...omit(props, "children")}>{props.children ?? <DefaultControls />}</parts.Controls>
  );
}

export const FlowGraphZoomIn = parts.ZoomIn;
export const FlowGraphZoomOut = parts.ZoomOut;
export const FlowGraphFit = parts.Fit;

function DefaultNodeParts() {
  return (
    <>
      <FlowGraphNodeStatus />
      <FlowGraphNodeLabel /> <FlowGraphNodeDetail />
      <FlowGraphNodeDescription />
    </>
  );
}

function DefaultLayers() {
  return (
    <>
      <FlowGraphEdges />
      <FlowGraphNodes />
    </>
  );
}

function DefaultControls() {
  return (
    <>
      <FlowGraphZoomIn />
      <FlowGraphZoomOut />
      <FlowGraphFit />
    </>
  );
}

function DefaultParts() {
  return (
    <>
      <FlowGraphPane />
      <FlowGraphControls />
    </>
  );
}
