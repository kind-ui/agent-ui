"use client";
import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Plan } from "@/components/ui/plan";
import { Queue } from "@/components/ui/queue";
import { Reasoning } from "@/components/ui/reasoning";
import { Status } from "@/components/ui/status";
import { Subagent } from "@/components/ui/subagent";
import { Tool } from "@/components/ui/tool";

const thoughts =
  "The tests fail because `retry` never waits. Find where it's called, then check the stale branch before changing anything.".split(
    " ",
  );

const TOOLS = thoughts.length + 1;
const PLAN = TOOLS + 10;
const DONE = PLAN + 12;

const stage = (tick: number, start: number, end: number): "pending" | "running" | "complete" =>
  tick < start ? "pending" : tick < end ? "running" : "complete";

const call = (id: string, name: string, input: unknown, output: unknown, done: boolean): ToolCall => ({
  toolCallId: id,
  name,
  dynamic: false,
  input: { state: "ready", value: input },
  ...(done && { output: { state: "available", value: output } }),
});

const tools = (tick: number): ToolCall[] => [
  call("search", "search_code", { query: "retry(" }, { hits: 2, top: "src/client.ts" }, tick >= TOOLS + 4),
  {
    ...call("delete", "delete_branch", { branch: "old-retry" }, { deleted: true }, tick >= TOOLS + 8),
    approval:
      tick < TOOLS + 6
        ? { approvalId: "approval", generation: 0, state: "requested" }
        : { approvalId: "approval", generation: 0, state: "responded", decision: { approved: true } },
  },
];

const nested = (tick: number): ToolCall[] => [
  call(
    "edit",
    "edit_file",
    { path: "src/retry.ts" },
    "Waits 2ⁿ × 100 ms between attempts.",
    tick >= PLAN + 4,
  ),
  ...(tick >= PLAN + 5
    ? [call("test", "run_tests", { filter: "retry" }, { passed: 12, failed: 0 }, tick >= PLAN + 9)]
    : []),
];

const followUps = [
  { id: "docs", status: "pending" as const, title: "Document the retry delay" },
  { id: "changelog", status: "pending" as const, title: "Write the changelog entry" },
  { id: "release", status: "pending" as const, title: "Draft the release notes" },
];

export default function AgentActivityShowcase() {
  const [run, setRun] = useState(0);
  const [tick, setTick] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [queue, setQueue] = useState(followUps);

  useEffect(() => {
    if (tick >= DONE || (tick === PLAN && !accepted)) return;
    const timer = setTimeout(() => setTick(tick + 1), 250);
    return () => clearTimeout(timer);
  }, [tick, accepted]);

  const replay = () => {
    setRun(run + 1);
    setTick(0);
    setAccepted(false);
    setQueue(followUps);
  };

  const status: StepStatus =
    tick >= DONE
      ? "complete"
      : (tick >= TOOLS && tick < TOOLS + 6) || (tick === PLAN && !accepted)
        ? "awaiting-input"
        : "running";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Status status={status} />
        <button
          type="button"
          onClick={replay}
          className="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 hover:bg-[var(--kind-color-hover)]"
        >
          Replay
        </button>
      </div>
      <div key={run} className="flex flex-col gap-1">
        <Reasoning
          status={tick < TOOLS ? "running" : "complete"}
          durationSeconds={6}
          text={thoughts.slice(0, tick).join(" ")}
        />
        {tick >= TOOLS && tools(tick).map((call) => <Tool key={call.toolCallId} call={call} />)}
        {tick >= PLAN && (
          <Plan
            label="Fix the retry delay"
            status={accepted ? stage(tick, PLAN, DONE) : "awaiting-input"}
            items={[
              { id: "find", status: "complete", title: "Find every call to retry" },
              {
                id: "fix",
                status: stage(tick, PLAN + 1, PLAN + 5),
                title: "Wait twice as long after each failure",
              },
              { id: "test", status: stage(tick, PLAN + 5, PLAN + 10), title: "Run the retry tests" },
            ]}
            onAccept={accepted ? undefined : () => setAccepted(true)}
          />
        )}
        {tick > PLAN && (
          <Subagent
            agentName="Fixer"
            status={stage(tick, PLAN + 1, PLAN + 10)}
            durationSeconds={3}
            defaultOpen
            result={
              tick >= PLAN + 10
                ? "`retry` now waits **twice as long** after each failure. All 12 tests pass."
                : ""
            }
          >
            {nested(tick).map((call) => (
              <Tool key={call.toolCallId} call={call} />
            ))}
          </Subagent>
        )}
      </div>
      <Queue
        label="Follow-ups"
        items={queue}
        onReorder={(id, { index }) =>
          setQueue((current) => {
            const moved = current.find((item) => item.id === id);
            if (!moved) return current;
            const rest = current.filter((item) => item !== moved);
            return [...rest.slice(0, index), moved, ...rest.slice(index)];
          })
        }
        onRemove={(id) => setQueue((current) => current.filter((item) => item.id !== id))}
      />
    </div>
  );
}
