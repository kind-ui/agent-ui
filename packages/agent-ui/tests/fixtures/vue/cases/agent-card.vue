<script lang="ts">
export const variants = ["all"] as const;
</script>

<script setup lang="ts">
import { onMounted } from "vue";
import { AgentCard } from "../../../../src/vue/agent-card.js";
import { agentCardHost, minimal, planner, reviewer } from "../../shared/agent-card.js";
import { expose } from "../../shared/expose.js";

defineProps<{ variant: string; params: URLSearchParams }>();

const host = agentCardHost();
const { record } = host;
onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div class="flex w-[28rem] flex-col gap-3 p-6">
    <section id="planner">
      <AgentCard
        :agent="planner"
        status="running"
        href="https://example.com/agents/planner"
        :on-action="record"
      />
    </section>
    <section id="reviewer">
      <AgentCard :agent="reviewer" status="complete" :level="2" action-label="Start" :on-action="record" />
    </section>
    <section id="minimal">
      <AgentCard :agent="minimal" href="data:text/html,Scout" />
    </section>
  </div>
</template>
