import type { WaterfallData, WaterfallDataItem } from "@ui-sdk/core/waterfall";
import type { Step, StepStatus, TraceSpan } from "../../types/index.js";

/** A span's kind, which picks its glyph. */
export type TraceSpanKind = NonNullable<TraceSpan["kind"]>;

/** A span as its row and details show it, in milliseconds from the trace's start. */
export type TraceEntry = {
  id: string;
  name: string;
  kind: TraceSpanKind;
  status: StepStatus;
  /** Milliseconds from the trace's start. */
  start: number;
  /** Milliseconds; a running span's grows to now. */
  duration: number;
  /** Whether it has no `end` yet. */
  running: boolean;
  /** Its `attributes`, as text. */
  attributes: [string, string][];
};

/** What `traceModel` gives: the Waterfall's spans and each span's entry by id. */
export type TraceModel = {
  items: WaterfallData;
  entries: Record<string, TraceEntry>;
  /** Whether any span is still running. */
  running: boolean;
  /** Whether the spans are timed as ISO 8601 instants, so now is the wall clock. */
  wallClock: boolean;
};

const STEP_KINDS: Partial<Record<Step["kind"], TraceSpanKind>> = {
  tool: "tool",
  terminal: "tool",
  subagent: "agent",
  reasoning: "model",
};
const KINDS: ReadonlySet<string> = new Set(["agent", "model", "tool", "other"]);

const parse = (time: number | string | undefined) => {
  if (typeof time === "number") return Number.isFinite(time) ? time : undefined;
  if (typeof time !== "string") return undefined;
  const at = Date.parse(time);
  return Number.isNaN(at) ? undefined : at;
};

const startsOf = (steps: Step[], into: number[] = []) => {
  for (const step of steps) {
    const at = parse(step.startedAt);
    if (at !== undefined) into.push(at);
    if (step.children) startsOf(step.children, into);
  }
  return into;
};

/**
 * Spans from Steps with a `startedAt`, in milliseconds from the earliest start (or `origin`). Children nest; a Step
 * without a `startedAt` is left out and its timed children take its place. Tool and terminal steps are `tool` spans,
 * subagents `agent`, reasoning `model`, and the rest `other`; a Step without `endedAt` is still running.
 */
export function traceSpans(steps: Step[], { origin }: { origin?: number | string } = {}): TraceSpan[] {
  const zero = parse(origin) ?? Math.min(...startsOf(steps));
  const build = (level: Step[]): TraceSpan[] =>
    level.flatMap((step) => {
      const start = parse(step.startedAt);
      const children = step.children ? build(step.children) : [];
      if (start === undefined) return children;
      const end = parse(step.endedAt);
      const span: TraceSpan = {
        id: step.id,
        name: step.title,
        kind: STEP_KINDS[step.kind] ?? "other",
        status: step.status,
        start: start - zero,
      };
      if (end !== undefined) span.end = end - zero;
      if (children.length) span.children = children;
      return [span];
    });
  return build(steps);
}

// An entry keeps its object while its span and times do, so a tick of the clock changes only running rows.
const entries = new WeakMap<TraceSpan, TraceEntry>();

const hasInstants = (spans: TraceSpan[]): boolean =>
  spans.some(
    (span) => typeof span.start === "string" || (span.children ? hasInstants(span.children) : false),
  );

const earliest = (spans: TraceSpan[], min = Number.POSITIVE_INFINITY): number => {
  for (const span of spans) {
    const start = parse(span.start);
    if (start !== undefined && start < min) min = start;
    if (span.children) min = earliest(span.children, min);
  }
  return min;
};

const latest = (
  spans: TraceSpan[],
  at: (time: number | string | undefined) => number | undefined,
  max = 0,
): number => {
  for (const span of spans) {
    max = Math.max(max, at(span.start) ?? max, at(span.end) ?? max);
    if (span.children) max = latest(span.children, at, max);
  }
  return max;
};

/**
 * The Waterfall's spans and each span's entry. Spans timed as ISO instants are placed from the earliest start;
 * numbers are already milliseconds from the trace's start. A running span ends at `now` (on the spans' clock: epoch
 * milliseconds or an ISO instant for ISO spans), else at the latest time any span reached.
 */
export function traceModel(spans: TraceSpan[], now?: number | string): TraceModel {
  const wallClock = hasInstants(spans);
  const origin = wallClock ? earliest(spans) : 0;
  const at = (time: number | string | undefined) => {
    const value = parse(time);
    return value === undefined ? undefined : wallClock ? value - origin : value;
  };
  const end = at(now) ?? latest(spans, at);
  const byId: Record<string, TraceEntry> = {};
  let running = false;
  const build = (level: TraceSpan[]): WaterfallData =>
    level.flatMap((span) => {
      const start = at(span.start);
      if (start === undefined || Object.hasOwn(byId, span.id)) return [];
      const finish = at(span.end);
      if (finish === undefined) running = true;
      const duration = Math.max(0, (finish ?? Math.max(end, start)) - start);
      const status = span.status ?? (finish === undefined ? "running" : "complete");
      let entry = entries.get(span);
      if (!entry || entry.start !== start || entry.duration !== duration || entry.status !== status) {
        entry = {
          id: span.id,
          name: span.name,
          kind: span.kind && KINDS.has(span.kind) ? span.kind : "other",
          status,
          start,
          duration,
          running: finish === undefined,
          attributes: Object.entries(span.attributes ?? {}).map(([key, value]) => [key, String(value)]),
        };
        entries.set(span, entry);
      }
      byId[span.id] = entry;
      const item: WaterfallDataItem = { value: span.id, label: span.name, start, duration };
      const children = span.children ? build(span.children) : [];
      if (children.length) item.children = children;
      return [item];
    });
  const items = build(spans);
  return { items, entries: byId, running, wallClock };
}

/** The Waterfall's spans: a running span ends at `now`, else at the latest time any span reached. */
export const waterfallItems = (spans: TraceSpan[], now?: number | string): WaterfallData =>
  traceModel(spans, now).items;
