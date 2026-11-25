import type { TraceSpan } from "@kind-ui/agent-ui";

/** One agent run, in milliseconds from its start. `search` starts at 120 ms and takes 340 ms. */
export const spans: TraceSpan[] = [
  {
    id: "run",
    name: "Answer the question",
    kind: "agent",
    status: "complete",
    start: 0,
    end: 4200,
    attributes: { model: "gpt-5", turns: 3 },
    children: [
      {
        id: "plan",
        name: "Plan the search",
        kind: "model",
        status: "complete",
        start: 0,
        end: 110,
        attributes: { "input tokens": 1840, "output tokens": 212 },
      },
      {
        id: "search",
        name: "web_search",
        kind: "tool",
        status: "complete",
        start: 120,
        end: 460,
        attributes: { query: "waterfall charts", results: 8 },
      },
      { id: "read", name: "read_url", kind: "tool", status: "error", start: 480, end: 1300 },
      {
        id: "researcher",
        name: "Researcher",
        kind: "agent",
        status: "complete",
        start: 1320,
        end: 3600,
        children: [
          { id: "summarize", name: "Summarize sources", kind: "model", status: "complete", start: 1400, end: 3100 },
          { id: "fetch", name: "fetch_page", kind: "tool", status: "complete", start: 3150, end: 3500 },
        ],
      },
      { id: "answer", name: "Write the answer", kind: "model", status: "complete", start: 3620, end: 4200 },
    ],
  },
  { id: "title", name: "Name the chat", kind: "model", status: "complete", start: 4210, end: 4380 },
];

const running = ({ id, name, kind, start, children }: TraceSpan): TraceSpan => ({
  id,
  name,
  kind,
  status: "running",
  start,
  ...(children && { children }),
});

/** The same run while it writes its answer: neither has an end yet, so both grow to `now`. */
export const runningSpans: TraceSpan[] = spans.map((span) =>
  span.id === "run"
    ? running({
        ...span,
        children: span.children?.map((child) => (child.id === "answer" ? running(child) : child)),
      })
    : span,
);

/** `count` spans: jobs of five, each a span with four steps, every job expanded. */
export function manySpans(count: number): { spans: TraceSpan[]; expanded: string[] } {
  const jobs = Math.ceil(count / 5);
  const list: TraceSpan[] = Array.from({ length: jobs }, (_, job) => ({
    id: `job-${job + 1}`,
    name: `job ${job + 1}`,
    kind: "agent",
    status: "complete",
    start: job * 40,
    end: job * 40 + 160,
    children: Array.from({ length: 4 }, (_, step) => ({
      id: `job-${job + 1}/step-${step + 1}`,
      name: `step ${step + 1}`,
      kind: step % 2 ? "tool" : "model",
      status: "complete",
      start: job * 40 + step * 40,
      end: job * 40 + step * 40 + 40,
    })),
  }));
  return { spans: list, expanded: list.map((span) => span.id) };
}

/** What the host heard, for the browser spec to read. */
export type TraceLog = { values: string[]; expanded: string[] };
