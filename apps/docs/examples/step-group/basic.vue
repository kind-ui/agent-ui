<script setup lang="ts">
import type { StepGroupItem, ToolCall } from "@kind-ui/agent-ui";
import { computed, ref } from "vue";
import { StepGroup } from "@/components/ui/vue/step-group";
import { Tool } from "@/components/ui/vue/tool";

// How each kind of step reads, live and done.
const kinds = {
  read: { live: "Reading", done: "Read", one: "file", many: "files" },
  run: { live: "Running", done: "Ran", one: "command", many: "commands" },
};

const steps = [
  { id: "a", kind: "read", target: "sign-in.ts", name: "read_file" },
  { id: "b", kind: "read", target: "session.ts", name: "read_file" },
  { id: "c", kind: "run", target: "npm test", name: "run_command" },
] as const;

const done = ref(1);

type Item = StepGroupItem & (typeof steps)[number];

const items = computed(() =>
  steps.map(
    (step, index): Item => ({
      ...step,
      status: index < done.value ? "complete" : index === done.value ? "running" : "pending",
    }),
  ),
);

const callOf = (item: Item): ToolCall => {
  const kind = kinds[item.kind];
  return {
    toolCallId: item.id,
    name: item.name,
    title: `${item.status === "complete" ? kind.done : kind.live} \`${item.target}\``,
    dynamic: false,
    input: { state: "ready", value: { target: item.target } },
    ...(item.status === "complete" && { output: { state: "available", value: "Done" } }),
  };
};

const next = () => {
  done.value = done.value === steps.length ? 1 : done.value + 1;
};
</script>

<template>
  <div class="flex flex-col items-start gap-3">
    <StepGroup :items="items" :kinds="kinds" :duration-seconds="done === steps.length ? 41 : undefined">
      <template v-for="item in items" :key="item.id">
        <Tool v-if="item.status !== 'pending'" :call="callOf(item)" :status="item.status" auto-open="never" />
      </template>
    </StepGroup>
    <button type="button" data-kind-button="secondary" @click="next">
      {{ done === steps.length ? "Start again" : "Finish a step" }}
    </button>
  </div>
</template>
