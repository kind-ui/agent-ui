import type { ToolCall } from "@kind-ui/agent-ui";
import { Subagent } from "@/components/ui/subagent";
import { Tool } from "@/components/ui/tool";

const calls: ToolCall[] = [
  {
    toolCallId: "call_1",
    name: "read_file",
    title: "Read `src/retry.ts`",
    dynamic: false,
    input: { state: "ready", value: { path: "src/retry.ts" } },
    output: { state: "available", value: "export async function retry(fn, attempts = 3) { … }" },
  },
  {
    toolCallId: "call_2",
    name: "run_tests",
    title: "Ran the retry tests",
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
      {calls.map((call) => (
        <Tool key={call.toolCallId} call={call} />
      ))}
    </Subagent>
  );
}
