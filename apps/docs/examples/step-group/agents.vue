<script setup lang="ts">
import type { StepStatus } from "@kind-ui/agent-ui";
import { computed, ref } from "vue";
import { StepGroup } from "@/components/ui/vue/step-group";
import { Subagent } from "@/components/ui/vue/subagent";

const rows = ref<{ id: string; name: string; status: StepStatus }[]>([
  { id: "reviewer", name: "Code reviewer", status: "running" },
  { id: "writer", name: "Docs writer", status: "running" },
  { id: "tester", name: "Test runner", status: "complete" },
]);

const items = computed(() => rows.value.map(({ id, status }) => ({ id, status, group: "agent" })));
const groupLabels = { agent: (count: number) => `${count} agents` };

function cancel() {
  rows.value = rows.value.map((row) => (row.status === "running" ? { ...row, status: "cancelled" } : row));
}
</script>

<template>
  <StepGroup :items="items" :group-labels="groupLabels" @cancel="cancel">
    <Subagent
      v-for="row in rows"
      :key="row.id"
      :agent-name="row.name"
      :status="row.status"
      :agent-confirm="false"
    />
  </StepGroup>
</template>
