import assert from "node:assert/strict";
import { test } from "node:test";
import { flowLayout } from "@kind-ui/agent-ui/core";

const size = { direction: "right", nodeWidth: 176, nodeHeight: 52 };
const nodes = [
  { id: "a", label: "Router", status: "complete" },
  { id: "b", label: "Billing", status: "running" },
  { id: "c", label: "Refunds" },
];
const edges = [
  { id: "ab", from: "a", to: "b" },
  { id: "bc", from: "b", to: "c" },
];

test("lays nodes out left to right and gives each edge a path", () => {
  const layout = flowLayout(nodes, edges, size);
  assert.deepEqual(Object.keys(layout.nodes), ["a", "b", "c"]);
  assert.ok(layout.nodes.a.left < layout.nodes.b.left && layout.nodes.b.left < layout.nodes.c.left);
  assert.equal(layout.nodes.a.width, 176);
  assert.match(layout.edges.ab, /^M[\d.]+ [\d.]+ L/);
  assert.ok(layout.width >= 3 * 176);
});

test("lays out top to bottom with direction down", () => {
  const layout = flowLayout(nodes, edges, { ...size, direction: "down" });
  assert.ok(layout.nodes.a.top < layout.nodes.b.top && layout.nodes.b.top < layout.nodes.c.top);
});

test("a status change keeps the cached layout", () => {
  const first = flowLayout(nodes, edges, size);
  const restatused = nodes.map((node) => ({ ...node, status: "error" }));
  const relabelled = edges.map((edge) => ({ ...edge, status: "running", label: "x" }));
  assert.equal(flowLayout(restatused, relabelled, size), first);
});

test("a new edge or node size lays out again", () => {
  const first = flowLayout(nodes, edges, size);
  assert.notEqual(flowLayout(nodes, [...edges, { id: "ac", from: "a", to: "c" }], size), first);
  assert.notEqual(flowLayout(nodes, edges, { ...size, nodeWidth: 200 }), first);
});

test("leaves out edges to missing nodes", () => {
  const layout = flowLayout(nodes, [...edges, { id: "ax", from: "a", to: "x" }], size);
  assert.equal(layout.edges.ax, undefined);
  assert.deepEqual(Object.keys(layout.nodes), ["a", "b", "c"]);
});
