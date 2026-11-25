<script setup lang="ts">
import { AgentCard } from "@/components/ui/vue/agent-card";

const agents = [
  {
    id: "planner",
    name: "Planner",
    model: "GPT-5",
    description: "Breaks a request into steps and hands each one to the agent that fits it.",
    capabilities: ["Planning", "Web search"],
  },
  {
    id: "reviewer",
    name: "Code Reviewer",
    model: "Claude Sonnet 4.5",
    description: "Reads a pull request and leaves comments on what to change.",
    capabilities: ["Code review", "Tests"],
  },
];
</script>

<template>
  <div class="grid w-full max-w-md gap-3">
    <AgentCard :agent="agents[0]" status="running" @action="(id: string) => console.log('open', id)" />
    <AgentCard
      :agent="agents[1]"
      status="complete"
      action-label="Start"
      @action="(id: string) => console.log('start', id)"
    />
  </div>
</template>
