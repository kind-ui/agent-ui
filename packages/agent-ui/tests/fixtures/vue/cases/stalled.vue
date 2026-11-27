<script lang="ts">
export const variants = ["all"] as const;
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Status } from "../../../../src/vue/status.js";
import { Step, StepContent, StepIcon, StepMeta, StepTitle, StepTrigger } from "../../../../src/vue/step.js";
import { ThinkingIndicator } from "../../../../src/vue/thinking-indicator.js";
import { expose } from "../../shared/expose.js";
import { stalled } from "../../shared/stalled.js";

defineProps<{ variant: string; params: URLSearchParams }>();

type Rows = Record<keyof typeof stalled, string>;

const activity = ref<Rows>({
  running: stalled.running.lastActivityAt,
  stalled: stalled.stalled.lastActivityAt,
  status: stalled.status.lastActivityAt,
  indicator: stalled.indicator.lastActivityAt,
});
const steps = ["running", "stalled"] as const;

onMounted(() =>
  expose({
    kindStalled: {
      touch: (id: keyof Rows) => (activity.value = { ...activity.value, [id]: new Date().toISOString() }),
    },
  }),
);
</script>

<template>
  <div class="flex w-[28rem] flex-col items-start gap-6 p-6">
    <div v-for="id in steps" :key="id" class="w-full">
      <Step :id="id" status="running" auto-open="never" :last-activity-at="activity[id]">
        <StepTrigger>
          <StepIcon />
          <StepTitle>{{ stalled[id].title }}</StepTitle>
          <StepMeta>{{ stalled[id].meta }}</StepMeta>
        </StepTrigger>
        <StepContent>
          <p>Reading the API reference.</p>
        </StepContent>
      </Step>
    </div>
    <ThinkingIndicator id="indicator" :last-activity-at="activity.indicator" />
    <Status id="status" status="running" :label="stalled.status.label" :last-activity-at="activity.status" />
  </div>
</template>
