import {
  type FlowGraphApi,
  type FlowGraphOptions,
  type FlowGraphState,
  type FlowGraphValueChangeReason,
  flowGraphPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

const SVG = "http://www.w3.org/2000/svg";
const DEFAULT_PARTS = `<kind-flow-graph-pane><kind-flow-graph-world><kind-flow-graph-edges><svg></svg></kind-flow-graph-edges><kind-flow-graph-nodes></kind-flow-graph-nodes></kind-flow-graph-world></kind-flow-graph-pane><kind-flow-graph-controls><kind-flow-graph-zoom-in><button></button></kind-flow-graph-zoom-in><kind-flow-graph-zoom-out><button></button></kind-flow-graph-zoom-out><kind-flow-graph-fit><button></button></kind-flow-graph-fit></kind-flow-graph-controls>`;
const NODE_PARTS = `<button><kind-flow-graph-node-status></kind-flow-graph-node-status><kind-flow-graph-node-label></kind-flow-graph-node-label> <kind-flow-graph-node-detail></kind-flow-graph-node-detail><kind-flow-graph-node-description></kind-flow-graph-node-description></button>`;

// Parts this element wrote into, and nodes it added. A part someone wrote into keeps it, and a node someone wrote
// stays, as React's children do. Kept across instances, because UI SDK rebuilds one when the element returns to
// the page.
const owned = new WeakSet<Element>();

const claim = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

/** Keeps one `path` per edge in an empty or owned `svg`, by edge id. */
const drawEdges = (svg: Element | null, { paths }: FlowGraphState) => {
  if (!claim(svg)) return;
  const byId = new Map<string, Element>();
  for (const path of [...svg.children]) {
    const id = path.getAttribute("data-edge");
    if (id === null || byId.has(id)) path.remove();
    else byId.set(id, path);
  }
  const ids = new Set(paths.map((path) => path.id));
  for (const [id, path] of byId) if (!ids.has(id)) path.remove();
  for (const { id, d, status } of paths) {
    let path = byId.get(id);
    if (!path) {
      path = svg.ownerDocument.createElementNS(SVG, "path");
      path.setAttribute("data-edge", id);
      svg.append(path);
    }
    if (path.getAttribute("d") !== d) path.setAttribute("d", d);
    if (path.getAttribute("data-status") !== status) path.setAttribute("data-status", status);
  }
};

/** Adds a node for each id the list lacks, removes the nodes it added that left, and fills in their parts. */
const drawNodes = (list: Element, { ids, entries }: FlowGraphState) => {
  const children = new Map<string | null, Element>();
  for (const child of [...list.children]) {
    const value = child.getAttribute("value");
    if (children.has(value) && owned.has(child)) child.remove();
    else if (!children.has(value)) children.set(value, child);
  }
  const keep = new Set<string | null>(ids);
  for (const [id, child] of children) if (owned.has(child) && !keep.has(id)) child.remove();
  for (const id of ids) {
    const entry = entries[id];
    if (!entry) continue;
    let child = children.get(id);
    if (!child) {
      child = list.ownerDocument.createElement("kind-flow-graph-node");
      child.setAttribute("value", id);
      child.innerHTML = NODE_PARTS;
      owned.add(child);
      list.append(child);
    }
    fill(child.querySelector("kind-flow-graph-node-label"), entry.label);
    fill(child.querySelector("kind-flow-graph-node-detail"), entry.detail);
    fill(child.querySelector("kind-flow-graph-node-description"), entry.description);
  }
};

/**
 * `<kind-flow-graph>` fills in its pane and controls when it has no children. Set `nodes` and `edges` as
 * properties: its edges get one `path` each, and its nodes list a `kind-flow-graph-node` for each node it lacks, with
 * its status mark, label and detail. Selecting a node fires `nodeselect`.
 */
export function defineFlowGraph(): void {
  if (customElements.get("kind-flow-graph")) return;
  createParts(flowGraphPrimitive, {
    root: {
      tag: "kind-flow-graph",
      events: { onValueChange: "nodeselect" },
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value) => void api.select(String(value)),
        },
      },
      api: ["getValue", "select", "fit", "zoomIn", "zoomOut"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as FlowGraphState;
          drawEdges(el.querySelector("kind-flow-graph-edges > svg"), state);
          const list = el.querySelector("kind-flow-graph-nodes");
          if (list) drawNodes(list, state);
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        // Parts and nodes written or removed after the element connects redraw it.
        const arrivals = new MutationObserver((records) => {
          const changed = records.some((record) =>
            [...record.addedNodes, ...record.removedNodes].some(
              (node) => node instanceof Element && node.localName.startsWith("kind-"),
            ),
          );
          if (changed) draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    pane: "kind-flow-graph-pane",
    world: "kind-flow-graph-world",
    edges: { tag: "kind-flow-graph-edges", target: wrappedChild("svg"), display: "contents" },
    nodes: "kind-flow-graph-nodes",
    node: { tag: "kind-flow-graph-node", target: wrappedButton, display: "contents" },
    "node-status": "kind-flow-graph-node-status",
    "node-label": "kind-flow-graph-node-label",
    "node-detail": "kind-flow-graph-node-detail",
    "node-description": "kind-flow-graph-node-description",
    controls: "kind-flow-graph-controls",
    "zoom-in": { tag: "kind-flow-graph-zoom-in", target: wrappedButton, display: "contents" },
    "zoom-out": { tag: "kind-flow-graph-zoom-out", target: wrappedButton, display: "contents" },
    fit: { tag: "kind-flow-graph-fit", target: wrappedButton, display: "contents" },
  });
}

export type KindFlowGraphEvents = {
  nodeselect: UiChangeEvent<string | null, FlowGraphValueChangeReason>;
};

export interface KindFlowGraphElement
  extends UiElement<KindFlowGraphEvents>,
    AttributeProperties<typeof flowGraphPrimitive, "api" | "value" | "nodes" | "edges"> {
  value: string | null;
  nodes?: FlowGraphOptions["nodes"];
  edges?: FlowGraphOptions["edges"];
  api: Pick<FlowGraphApi, "getValue" | "select" | "fit" | "zoomIn" | "zoomOut">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-flow-graph": KindFlowGraphElement;
    "kind-flow-graph-pane": HTMLElement;
    "kind-flow-graph-world": HTMLElement;
    "kind-flow-graph-edges": HTMLElement;
    "kind-flow-graph-nodes": HTMLElement;
    "kind-flow-graph-node": UiPartElement<typeof flowGraphPrimitive, "node", "value">;
    "kind-flow-graph-node-status": HTMLElement;
    "kind-flow-graph-node-label": HTMLElement;
    "kind-flow-graph-node-detail": HTMLElement;
    "kind-flow-graph-node-description": HTMLElement;
    "kind-flow-graph-controls": HTMLElement;
    "kind-flow-graph-zoom-in": HTMLElement;
    "kind-flow-graph-zoom-out": HTMLElement;
    "kind-flow-graph-fit": HTMLElement;
  }
}
