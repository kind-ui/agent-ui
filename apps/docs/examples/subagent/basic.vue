<script setup lang="ts">
import type { ToolCall } from "@kind-ui/agent-ui";
import { Subagent } from "@/components/ui/vue/subagent";
import { Tool } from "@/components/ui/vue/tool";

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

<template>
  <Subagent
    agent-name="Code reviewer"
    status="complete"
    :duration-seconds="14"
    default-open
    result="Looks good. `retry` waits **twice as long** after each failure, and all 12 tests pass."
  >
    <Tool v-for="call in calls" :key="call.toolCallId" :call="call" />
  </Subagent>
</template>
