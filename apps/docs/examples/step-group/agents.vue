<script setup lang="ts">
import type { StepGroupItem } from "@kind-ui/agent-ui";
import { StepGroup } from "@/components/ui/vue/step-group";
import { Subagent } from "@/components/ui/vue/subagent";

const kinds = { agent: { live: "Running", done: "Ran", one: "agent", many: "agents" } };

const agents = [
  { id: "reviewer", name: "Code reviewer", status: "complete" },
  { id: "writer", name: "Test writer", status: "running" },
  { id: "docs", name: "Docs updater", status: "pending" },
] as const;

const items: StepGroupItem[] = agents.map(({ id, status }) => ({ id, status, kind: "agent" }));
</script>

<template>
  <StepGroup :items="items" :kinds="kinds">
    <Subagent
      v-for="agent in agents"
      :key="agent.id"
      :agent-name="agent.name"
      :status="agent.status"
      auto-open="never"
    />
  </StepGroup>
</template>
