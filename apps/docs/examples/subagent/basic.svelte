<script lang="ts">
  import type { ToolCall } from "@kind-ui/agent-ui";
  import { Subagent } from "@/components/ui/svelte/subagent/index.js";
  import { Tool } from "@/components/ui/svelte/tool/index.js";

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
</script>

<Subagent
  agentName="Code reviewer"
  status="complete"
  durationSeconds={14}
  defaultOpen
  result="Looks good. `retry` waits **twice as long** after each failure, and all 12 tests pass."
>
  {#each calls as call (call.toolCallId)}
    <Tool {call} />
  {/each}
</Subagent>
