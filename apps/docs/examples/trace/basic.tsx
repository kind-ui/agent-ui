import type { TraceSpan } from "@kind-ui/agent-ui";
import { Trace } from "@/components/ui/trace";

const spans: TraceSpan[] = [
  {
    id: "run",
    name: "Answer the question",
    kind: "agent",
    status: "complete",
    start: 0,
    end: 4200,
    attributes: { model: "gpt-5", turns: 3 },
    children: [
      { id: "plan", name: "Plan the search", kind: "model", status: "complete", start: 0, end: 110 },
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
          {
            id: "summarize",
            name: "Summarize sources",
            kind: "model",
            status: "complete",
            start: 1400,
            end: 3100,
          },
          { id: "fetch", name: "fetch_page", kind: "tool", status: "complete", start: 3150, end: 3500 },
        ],
      },
      { id: "answer", name: "Write the answer", kind: "model", status: "complete", start: 3620, end: 4200 },
    ],
  },
];

export default function TraceExample() {
  return (
    <Trace
      label="Agent run"
      spans={spans}
      defaultExpanded={["run"]}
      defaultValue="search"
      className="w-full"
    />
  );
}
