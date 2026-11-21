import type { ToolCall } from "@kind-ui/agent-ui";
import { For } from "solid-js";
import { Subagent } from "@/components/ui/solid/subagent";
import { Tool } from "@/components/ui/solid/tool";

const calls: ToolCall[] = [
  {
    toolCallId: "call_1",
    name: "read_file",
    dynamic: false,
    input: { state: "ready", value: { path: "src/retry.ts" } },
    output: { state: "available", value: "export async function retry(fn, attempts = 3) { … }" },
  },
  {
    toolCallId: "call_2",
    name: "run_tests",
    dynamic: false,
    input: { state: "ready", value: { filter: "retry" } },
    output: { state: "available", value: { passed: 12, failed: 0 } },
  },
];

export default function SubagentExample() {
  return (
    <Subagent
      agentName="Code reviewer"
      status="complete"
      durationSeconds={14}
      defaultOpen
      result="Looks good. `retry` waits **twice as long** after each failure, and all 12 tests pass."
    >
      <For each={calls}>{(call) => <Tool call={call} />}</For>
    </Subagent>
  );
}
