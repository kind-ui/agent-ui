import {
  type ChangeDetails,
  createChange,
  createViewport,
  css,
  definePrimitive,
  idPart,
  live,
  type SlotDefinition,
  selects,
  spatialMove,
  type Viewport,
  type ViewportReason,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { FlowEdge, FlowNode, StepStatus } from "../../types/index.js";
import { createListFocus, type ListFocus } from "../list-focus.js";
import { cached } from "../memo.js";
import { type MotionMode, resolvedMotion } from "../motion/index.js";
import { DURATION } from "../motion/tokens.js";
import { type FlowDirection, type FlowLayout, flowLayout } from "./layout.js";

export type FlowGraphValueChangeReason = "node-press" | "imperative";

export type FlowGraphOptions = {
  /** The graph's nodes: agents, tools and people. Keep each one's `id` as the graph changes. Defaults to none. */
  nodes?: FlowNode[];
  /** The edges between nodes, from one node's `id` to another's. Defaults to none. */
  edges?: FlowEdge[];
  /**
   * Names the graph.
   * @default "Flow"
   */
  label?: string;
  /**
   * Which way edges run.
   * @default "right"
   */
  direction?: FlowDirection;
  /** The selected node's `id`. Passing it controls it: change it in `onValueChange`. */
  value?: string | null;
  /**
   * The selected node at first, when `value` isn't passed.
   * @default null
   */
  defaultValue?: string | null;
  /** Called when a node is selected, with what caused it. */
  onValueChange?: (value: string | null, details: ChangeDetails<FlowGraphValueChangeReason>) => void;
  /**
   * `"auto"` follows `prefers-reduced-motion`. Fit, zoom and reveal ease only at full motion.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** A node as the graph shows it. */
export type FlowNodeEntry = {
  label: string;
  /** The kind in words, like "Agent". Empty for `other`. */
  kind: string;
  status: StepStatus;
  /** The status in words, like "Running". */
  statusText: string;
  /** "<label>, <kind>, <status>". */
  name: string;
  /** The line under the label: the kind and status, like "Agent · Running". */
  detail: string;
  /** The node's `description` and its edges in words, like "Hands off to Billing." */
  description: string;
};

export type FlowEdgeEntry = { id: string; d: string; status: StepStatus };

export type FlowGraphState = {
  nodes: FlowNode[];
  /** Node ids in order. */
  ids: string[];
  /** Each node as the graph shows it, by id. A node that didn't change keeps its entry. */
  entries: Record<string, FlowNodeEntry>;
  /** Every edge with a path, in order. */
  paths: FlowEdgeEntry[];
  layout: FlowLayout;
  label: string;
  value: string | null;
  /** The node with the Tab stop. */
  focused: string | null;
  /** Where the graph sits in its frame. Live: panning renders nothing. */
  viewport: Viewport;
  /** Whether the world is easing to a viewport set from code, a key or focus. Live. */
  easing: boolean;
  motion: MotionMode;
};

export type FlowGraphApi = {
  getValue: () => string | null;
  getNodes: () => FlowNode[];
  /** Selects a node by id. Returns whether the change was accepted. */
  select: (id: string, event?: Event) => boolean;
  /** Shows the whole graph. */
  fit: (event?: Event) => boolean;
  zoomIn: (event?: Event) => boolean;
  zoomOut: (event?: Event) => boolean;
  viewport: ReturnType<typeof createViewport<FlowGraphState>>;
  /** Fits the graph once the frame has a size, and again when the graph changes until a person moves it. */
  bindRoot: (el: HTMLElement) => () => void;
} & ListFocus<FlowGraphState, NodeProps>;

type NodeProps = { value: string };
type NodePartProps = { value?: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<FlowGraphState, FlowGraphApi, Props, Public>;
type NodePartSlot<Public extends object = Record<never, never>> = Slot<NodePartProps & BaseSlotProps, Public>;

type FlowGraphSlots = {
  root: Slot;
  pane: Slot;
  world: Slot;
  edges: Slot<BaseSlotProps, { paths: FlowEdgeEntry[] }>;
  nodes: Slot<BaseSlotProps, { ids: string[] }>;
  node: Slot<NodeProps & BaseSlotProps, { entry: FlowNodeEntry }>;
  "node-status": NodePartSlot;
  "node-label": NodePartSlot<{ label: string }>;
  "node-detail": NodePartSlot<{ detail: string }>;
  "node-description": NodePartSlot<{ description: string }>;
  controls: Slot;
  "zoom-in": Slot;
  "zoom-out": Slot;
  fit: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type FlowGraphPrimitive = ReturnType<
  typeof definePrimitive<FlowGraphOptions, FlowGraphState, FlowGraphApi, FlowGraphSlots>
>;

/** Every node's size in pixels. Fixed, so the server and the browser lay a graph out the same. */
export const FLOW_NODE_WIDTH = 176;
export const FLOW_NODE_HEIGHT = 52;

const KINDS: Record<string, string> = { agent: "Agent", tool: "Tool", person: "Person" };
const STATUSES: Record<StepStatus, string> = {
  pending: "Pending",
  running: "Running",
  "awaiting-input": "Needs input",
  complete: "Done",
  error: "Failed",
  cancelled: "Cancelled",
};
const statusOf = (status: string | undefined): StepStatus =>
  status !== undefined && Object.hasOwn(STATUSES, status) ? (status as StepStatus) : "pending";

const noNodes: FlowNode[] = [];
const noEdges: FlowEdge[] = [];
const noEntry: FlowNodeEntry = {
  label: "",
  kind: "",
  status: "pending",
  statusText: "",
  name: "",
  detail: "",
  description: "",
};
const ZOOM_STEP = 1.25;
const FIT = { padding: 24, maxZoom: 1 };
const fromNode = { value: { kind: "string", from: "node" } } as const;
// Own keys only, so a node `id` like "constructor" doesn't find `Object`'s.
const entryAt = ({ entries }: FlowGraphState, key: string) =>
  Object.hasOwn(entries, key) ? (entries[key] as FlowNodeEntry) : noEntry;

/** A node's edges in words: "Hands off to Billing: refunds." for each edge out, then "Receives from Router." */
const edgeWords = (id: string, edges: readonly FlowEdge[], labels: Map<string, string>) => {
  const words: string[] = [];
  const say = (verb: string, other: string, edge: FlowEdge) => {
    const name = labels.get(other);
    if (name === undefined) return;
    const status = edge.status === "running" ? ", running" : edge.status === "error" ? ", failed" : "";
    words.push(`${verb} ${name}${edge.label ? `: ${edge.label}` : ""}${status}.`);
  };
  for (const edge of edges) if (edge.from === id) say("Hands off to", edge.to, edge);
  for (const edge of edges) if (edge.to === id && edge.from !== id) say("Receives from", edge.from, edge);
  return words.join(" ");
};

const entryOf = (node: FlowNode, edgeText: string): FlowNodeEntry => {
  const kind = KINDS[node.kind ?? ""] ?? "";
  const status = statusOf(node.status);
  const statusText = STATUSES[status];
  return {
    label: node.label,
    kind,
    status,
    statusText,
    name: [node.label, kind, statusText].filter(Boolean).join(", "),
    detail: [kind, statusText].filter(Boolean).join(" · "),
    description: [node.description ? `${node.description}.` : "", edgeText].filter(Boolean).join(" "),
  };
};

const sameEntry = (a: FlowNodeEntry, b: FlowNodeEntry) =>
  a.name === b.name && a.detail === b.detail && a.description === b.description;

// An unchanged node keeps its entry, even as a new object, so only a changed node's parts render again.
let previous = new Map<string, FlowNodeEntry>();
const buildEntries = (nodes: readonly FlowNode[], edges: readonly FlowEdge[]) => {
  const labels = new Map(nodes.map((node) => [node.id, node.label]));
  const next = new Map<string, FlowNodeEntry>();
  const byId: Record<string, FlowNodeEntry> = {};
  for (const node of nodes) {
    if (next.has(node.id)) continue;
    const built = entryOf(node, edgeWords(node.id, edges, labels));
    const kept = previous.get(node.id);
    const entry = kept && sameEntry(kept, built) ? kept : built;
    next.set(node.id, entry);
    byId[node.id] = entry;
  }
  previous = next;
  return byId;
};

const buildPaths = (edges: readonly FlowEdge[], layout: FlowLayout) => {
  const paths: FlowEdgeEntry[] = [];
  for (const edge of edges) {
    const d = layout.edges[edge.id];
    if (d) paths.push({ id: edge.id, d, status: statusOf(edge.status) });
  }
  return paths;
};

// Cached by the objects they're built from, since Svelte and Solid run `sync` on every store write and a new
// object each time would write again. A `WeakMap` per input, not one slot, so graphs side by side don't evict each
// other's values.
const entryCache = new WeakMap<
  readonly FlowNode[],
  WeakMap<readonly FlowEdge[], Record<string, FlowNodeEntry>>
>();
const pathCache = new WeakMap<readonly FlowEdge[], WeakMap<FlowLayout, FlowEdgeEntry[]>>();
const idCache = new WeakMap<FlowLayout, string[]>();
const twice = <A extends object, B extends object, V>(
  cache: WeakMap<A, WeakMap<B, V>>,
  a: A,
  b: B,
  build: (a: A, b: B) => V,
): V =>
  cached(
    cached(cache, a, () => new WeakMap<B, V>()),
    b,
    () => build(a, b),
  );

const presentation = ({
  nodes = noNodes,
  edges = noEdges,
  label,
  direction,
  motion = "auto",
}: FlowGraphOptions) => {
  const layout = flowLayout(nodes, edges, {
    direction: direction === "down" ? "down" : "right",
    nodeWidth: FLOW_NODE_WIDTH,
    nodeHeight: FLOW_NODE_HEIGHT,
  });
  return {
    nodes,
    ids: cached(idCache, layout, () => Object.keys(layout.nodes)),
    entries: twice(entryCache, nodes, edges, buildEntries),
    paths: twice(pathCache, edges, layout, buildPaths),
    layout,
    label: label || "Flow",
    motion,
  };
};

/** A node's parts hear only about their own node. */
const own = selects<FlowGraphState, FlowGraphApi, NodePartProps>({
  entries: ({ key }) => [key],
  nodes: [],
  ids: [],
  paths: [],
  label: [],
  value: [],
  focused: [],
});

/** Parts that draw nothing from the graph's data. */
const still = selects<FlowGraphState, FlowGraphApi, BaseSlotProps>({
  entries: [],
  paths: [],
  ids: [],
  value: [],
  focused: [],
  nodes: [],
  layout: [],
});
/** The world reads only the graph's size. */
const frame = selects<FlowGraphState, FlowGraphApi, BaseSlotProps>({
  entries: [],
  paths: [],
  ids: [],
  value: [],
  focused: [],
  nodes: [],
});

const EASED: ReadonlySet<ViewportReason> = new Set(["imperative", "zoom-key", "focus-in"]);
const MOVED: ReadonlySet<ViewportReason> = new Set(["wheel", "drag", "pinch", "zoom-key", "focus-in"]);

export const flowGraphPrimitive: FlowGraphPrimitive = definePrimitive<
  FlowGraphOptions,
  FlowGraphState,
  FlowGraphApi,
  FlowGraphSlots
>({
  name: "kind-flow-graph",
  options: {
    nodes: "value",
    edges: "value",
    label: "string",
    direction: "string",
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    value: options.value ?? options.defaultValue ?? null,
    focused: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    easing: false,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.value === undefined ? {} : { value: options.value }),
  }),
  live: ["viewport", "easing"],
  controlled: ["value"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    let moved = false;
    // The graph's own fits, as it first shows and when its shape changes, jump rather than ease.
    let placing = false;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const viewport = createViewport<FlowGraphState>(context, {
      key: "viewport",
      surface: () => context.element("root"),
      set: (value, { reason }) => {
        if (MOVED.has(reason)) moved = true;
        const easing = !placing && EASED.has(reason) && resolvedMotion(store.get().motion) === "full";
        clearTimeout(settle);
        if (easing) settle = setTimeout(() => store.set({ easing: false }), DURATION.base * 1000);
        store.set({ viewport: value, easing });
        return true;
      },
    });
    context.onDestroy(() => clearTimeout(settle));
    const { layout: first } = store.get();
    const place = () => {
      placing = true;
      fit();
      placing = false;
    };
    const fit = (event?: Event) => {
      const { width, height } = store.get().layout;
      return viewport.fit({ left: 0, top: 0, right: width, bottom: height }, FIT, {
        reason: "imperative",
        ...(event && { event }),
      });
    };
    const zoom = (factor: number, event?: Event) =>
      viewport.zoomBy(factor, undefined, { reason: "imperative", ...(event && { event }) });
    const select = (id: string, reason: FlowGraphValueChangeReason, event?: Event) =>
      Object.hasOwn(store.get().layout.nodes, id) &&
      (id === store.get().value || change("value", id, event ? { reason, event } : { reason }));
    const listFocus = createListFocus<FlowGraphState, NodeProps>(context, {
      slot: "node",
      orientation: () => "both",
      // The layout's boxes, so an arrow finds a node off screen as well as one in view.
      move: spatialMove({
        rect: (_el, key) => {
          const box = store.get().layout.nodes[key];
          return box
            ? { left: box.left, top: box.top, right: box.left + box.width, bottom: box.top + box.height }
            : { left: 0, top: 0, right: 0, bottom: 0 };
        },
      }),
      fallback: () => context.element("root"),
    });
    return {
      ...listFocus,
      viewport,
      getValue: () => store.get().value,
      getNodes: () => store.get().nodes,
      select: (id, event) => select(id, event ? "node-press" : "imperative", event),
      fit,
      zoomIn: (event) => zoom(ZOOM_STEP, event),
      zoomOut: (event) => zoom(1 / ZOOM_STEP, event),
      bindRoot: () => {
        let shown = first;
        const frame = requestAnimationFrame(() => {
          shown = store.get().layout;
          place();
        });
        const unsubscribe = store.subscribe(() => {
          const { layout } = store.get();
          if (layout === shown) return;
          shown = layout;
          if (!moved) place();
        });
        return () => {
          cancelAnimationFrame(frame);
          unsubscribe();
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state) => ({
        "aria-label": state.label,
        "data-flow-graph-part": "root",
        "data-motion": state.motion,
        style: css({ position: "relative", overflow: "clip", "touch-action": "none" }),
      }),
      on: {
        wheel: (event, { api }) => api.viewport.wheel(event as WheelEvent),
        pointerdown: (event, { api }) => {
          const target = event.target as Element | null;
          if (!target?.closest("[data-flow-graph-part=node],[data-flow-graph-part=controls]")) {
            api.viewport.pointerdown(event as PointerEvent);
          }
        },
        keydown: (event, { api }) => {
          const target = event.target as Element | null;
          if (!target?.closest("[data-flow-graph-part=controls]"))
            api.viewport.keydown(event as KeyboardEvent);
        },
      },
      bind: (el, { api }) => api.bindRoot(el),
    }),
    // Find in page scrolls this pane, and the viewport turns each scroll into a pan.
    pane: slot({
      attrs: () => ({
        "data-flow-graph-part": "pane",
        style: css({
          position: "absolute",
          inset: "0",
          overflow: "scroll",
          "scrollbar-width": "none",
          "touch-action": "none",
          "pointer-events": "none",
        }),
      }),
      bind: (el, { api }) => api.viewport.bindFindable(el),
    }),
    world: slot({
      selects: frame,
      attrs: (state) => ({
        "data-flow-graph-part": "world",
        "data-motion": state.motion,
        style: css({
          position: "absolute",
          left: "0",
          top: "0",
          width: `${state.layout.width}px`,
          height: `${state.layout.height}px`,
          "transform-origin": "0 0",
          "pointer-events": "auto",
        }),
      }),
      // Fit, the zoom buttons and keys, and focus ease to their place; a drag, a wheel or a pinch follows at once.
      live: live((state, { api }) => ({
        style: state.easing
          ? `${api.viewport.style(state)};transition:transform var(--kind-duration-base) var(--kind-ease-out)`
          : api.viewport.style(state),
      })),
    }),
    edges: slot<BaseSlotProps, { paths: FlowEdgeEntry[] }>({
      selects: selects<FlowGraphState, FlowGraphApi, BaseSlotProps>({
        entries: [],
        ids: [],
        value: [],
        focused: [],
        nodes: [],
      }),
      state: (state) => ({ paths: state.paths }),
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-flow-graph-part": "edges",
        width: String(state.layout.width),
        height: String(state.layout.height),
        viewBox: `0 0 ${state.layout.width} ${state.layout.height}`,
      }),
    }),
    nodes: slot<BaseSlotProps, { ids: string[] }>({
      selects: selects<FlowGraphState, FlowGraphApi, BaseSlotProps>({
        entries: [],
        paths: [],
        value: [],
        focused: [],
        nodes: [],
      }),
      state: (state) => ({ ids: state.ids }),
      attrs: () => ({ "data-flow-graph-part": "nodes" }),
    }),
    node: slot<NodeProps & BaseSlotProps, { entry: FlowNodeEntry }>({
      role: "button",
      focus: "roving",
      props: { value: "string" },
      selects: selects<FlowGraphState, FlowGraphApi, NodeProps>({
        entries: ({ key }) => [key],
        nodes: [],
        ids: [],
        paths: [],
        label: [],
      }),
      press: ({ api, key }, event) => api.select(key, event),
      state: (state, { key }) => ({ entry: entryAt(state, key) }),
      attrs: (state, part) => {
        const box = state.layout.nodes[part.key];
        const entry = entryAt(state, part.key);
        return {
          type: "button",
          "aria-label": entry.name,
          "aria-describedby": entry.description ? `${part.id}-${idPart(part.key)}-description` : undefined,
          "aria-pressed": String(state.value === part.key),
          tabindex: part.api.roving.tabIndex(state, part),
          "data-flow-graph-part": "node",
          "data-status": entry.status,
          "data-selected": state.value === part.key ? "" : undefined,
          style: box
            ? css({
                position: "absolute",
                left: `${box.left}px`,
                top: `${box.top}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
              })
            : undefined,
        };
      },
      on: {
        keydown: (event, { el, api }) => {
          if (el) api.roving.keydown(event as KeyboardEvent, el);
        },
        // The pane pans only when the browser scrolls to a node, which it doesn't always do on focus.
        focus: (event, { api, key, store }) => {
          const box = store.get().layout.nodes[key];
          if (box) {
            const rect = {
              left: box.left,
              top: box.top,
              right: box.left + box.width,
              bottom: box.top + box.height,
            };
            api.viewport.reveal(rect, { padding: 16 }, { reason: "focus-in", event });
          }
        },
      },
      bind: (el, part) => {
        const unbindFocus = part.api.roving.bind(el, part);
        const unbindRecovery = part.api.recovery.bind(el, part);
        return () => {
          unbindFocus();
          unbindRecovery();
        };
      },
    }),
    "node-status": slot<NodePartProps & BaseSlotProps>({
      props: fromNode,
      selects: own,
      attrs: (state, { key }) => ({
        "aria-hidden": "true",
        "data-flow-graph-part": "node-status",
        "data-status-mark": "",
        "data-status": entryAt(state, key).status,
      }),
    }),
    "node-label": slot<NodePartProps & BaseSlotProps, { label: string }>({
      props: fromNode,
      selects: own,
      state: (state, { key }) => ({ label: entryAt(state, key).label }),
      attrs: () => ({ "data-flow-graph-part": "node-label" }),
    }),
    "node-detail": slot<NodePartProps & BaseSlotProps, { detail: string }>({
      props: fromNode,
      selects: own,
      state: (state, { key }) => ({ detail: entryAt(state, key).detail }),
      attrs: () => ({ "data-flow-graph-part": "node-detail" }),
    }),
    // Hidden: it describes the node through `aria-describedby`, which reads hidden text.
    "node-description": slot<NodePartProps & BaseSlotProps, { description: string }>({
      props: fromNode,
      selects: own,
      state: (state, { key }) => ({ description: entryAt(state, key).description }),
      attrs: (_state, part) => ({
        id: `${part.id}-${idPart(part.key)}-description`,
        hidden: "",
        "data-flow-graph-part": "node-description",
      }),
    }),
    controls: slot({
      selects: still,
      attrs: () => ({ "data-flow-graph-part": "controls" }),
    }),
    "zoom-in": slot({
      role: "button",
      focus: "native",
      selects: still,
      press: ({ api }, event) => api.zoomIn(event),
      attrs: () => ({
        type: "button",
        "aria-label": "Zoom in",
        "data-flow-graph-part": "zoom-in",
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
      }),
    }),
    "zoom-out": slot({
      role: "button",
      focus: "native",
      selects: still,
      press: ({ api }, event) => api.zoomOut(event),
      attrs: () => ({
        type: "button",
        "aria-label": "Zoom out",
        "data-flow-graph-part": "zoom-out",
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
      }),
    }),
    fit: slot({
      role: "button",
      focus: "native",
      selects: still,
      press: ({ api }, event) => api.fit(event),
      attrs: () => ({
        type: "button",
        "aria-label": "Fit to view",
        "data-flow-graph-part": "fit",
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
      }),
    }),
  }),
  // Nodes are listed by id, so an agent can name one to `select`.
  agent: {
    actions: ["select", "fit", "zoomIn", "zoomOut"],
    items: (api: FlowGraphApi) => api.getNodes().map((node) => ({ value: node.id, label: node.label })),
    closed: true,
  },
});
