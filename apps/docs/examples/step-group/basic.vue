<script setup lang="ts">
import type { ToolCall } from "@kind-ui/agent-ui";
import { StepGroup } from "@/components/ui/vue/step-group";
import { Tool } from "@/components/ui/vue/tool";

const call = (toolCallId: string, name: string, value: object, output: unknown): ToolCall => ({
  toolCallId,
  name,
  dynamic: false,
  input: { state: "ready", value },
  output: { state: "available", value: output },
});

const calls = [
  {
    group: "read",
    call: call("call_1", "read_file", { path: "src/retry.ts" }, "export async function retry(…)"),
  },
  { group: "read", call: call("call_2", "read_file", { path: "src/retry.test.ts" }, 'describe("retry", …)') },
  { group: "run", call: call("call_3", "bash", { command: "npm test -- retry" }, "12 passed") },
];

const items = calls.map(({ group, call }) => ({ id: call.toolCallId, group, status: "complete" as const }));

const groupLabels = {
  read: (count: number) => `read ${count} ${count === 1 ? "file" : "files"}`,
  run: (count: number) => `ran ${count} ${count === 1 ? "command" : "commands"}`,
};
</script>

<template>
  <StepGroup :items="items" :group-labels="groupLabels" :duration-seconds="6" default-open>
    <Tool v-for="{ call } in calls" :key="call.toolCallId" :call="call" />
  </StepGroup>
</template>
