import { graphlib, layout } from "@dagrejs/dagre";
import type { FlowEdge, FlowNode } from "../../types/index.js";

export type FlowDirection = "right" | "down";

/** A node's box on the canvas, in pixels from the graph's top left. */
export type FlowNodeBox = { left: number; top: number; width: number; height: number };

export type FlowLayout = {
  width: number;
  height: number;
  nodes: Record<string, FlowNodeBox>;
  /** Each edge's SVG path by id: its line and, at its end, an open arrowhead. */
  edges: Record<string, string>;
};

export type FlowLayoutOptions = {
  direction: FlowDirection;
  nodeWidth: number;
  nodeHeight: number;
};

type Point = { x: number; y: number };

const ARROW = 6;
const round = (n: number) => Math.round(n * 10) / 10;

const pathOf = (points: Point[]): string => {
  if (points.length < 2) return "";
  const line = points.map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join(" ");
  const tip = points[points.length - 1] as Point;
  const from = points[points.length - 2] as Point;
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const wing = (side: number) => {
    const a = angle + Math.PI + side * (Math.PI / 6);
    return `${round(tip.x + ARROW * Math.cos(a))} ${round(tip.y + ARROW * Math.sin(a))}`;
  };
  return `${line} M${wing(-1)} L${round(tip.x)} ${round(tip.y)} L${wing(1)}`;
};

const build = (
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[],
  options: FlowLayoutOptions,
): FlowLayout => {
  const graph = new graphlib.Graph({ multigraph: true });
  graph.setGraph({ rankdir: options.direction === "down" ? "TB" : "LR", nodesep: 24, ranksep: 56 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of nodes) graph.setNode(node.id, { width: options.nodeWidth, height: options.nodeHeight });
  for (const edge of edges) {
    if (graph.hasNode(edge.from) && graph.hasNode(edge.to)) graph.setEdge(edge.from, edge.to, {}, edge.id);
  }
  layout(graph);
  const boxes: Record<string, FlowNodeBox> = {};
  for (const id of graph.nodes()) {
    const { x, y, width, height } = graph.node(id);
    boxes[id] = { left: round(x - width / 2), top: round(y - height / 2), width, height };
  }
  const paths: Record<string, string> = {};
  for (const ref of graph.edges()) {
    if (ref.name !== undefined) paths[ref.name] = pathOf(graph.edge(ref).points ?? []);
  }
  const { width = 0, height = 0 } = graph.graph();
  return { width: Math.ceil(width), height: Math.ceil(height), nodes: boxes, edges: paths };
};

const CACHE_SIZE = 32;
const cache = new Map<string, FlowLayout>();

/**
 * Lays a graph out with dagre: each node's box and each edge's path, in pixels. The result is cached by the graph's
 * shape (node ids, edges, direction and node size), so a new `nodes` array that only changes a status lays nothing
 * out again and returns the same object. Edges to a node that isn't in `nodes` are left out.
 */
export const flowLayout = (
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[],
  options: FlowLayoutOptions,
): FlowLayout => {
  const key = JSON.stringify([
    options.direction,
    options.nodeWidth,
    options.nodeHeight,
    nodes.map((node) => node.id),
    edges.map((edge) => [edge.id, edge.from, edge.to]),
  ]);
  let value = cache.get(key);
  if (value) cache.delete(key);
  else {
    value = build(nodes, edges, options);
    if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  }
  cache.set(key, value);
  return value;
};
