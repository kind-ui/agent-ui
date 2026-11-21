<script lang="ts">
export const variants = ["all"] as const;
</script>

<script setup lang="ts">
import type { StepStatus } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { onMounted, ref } from "vue";
import { Status, StatusIcon, StatusLabel } from "../../../../src/vue/status.js";
import { expose } from "../../shared/expose.js";

defineProps<{ variant: string; params: URLSearchParams }>();

const statuses: StepStatus[] = ["pending", "running", "awaiting-input", "complete", "error", "cancelled"];
const status = ref<StepStatus>("running");
const label = ref<string>();
const motion = ref<MotionMode>("auto");

onMounted(() =>
  expose({
    kindStatus: {
      setStatus: (next: StepStatus) => (status.value = next),
      setLabel: (next?: string) => (label.value = next),
      setMotion: (next: MotionMode) => (motion.value = next),
    },
  }),
);
</script>

<template>
  <div class="flex flex-col items-start gap-3 bg-[var(--kind-color-surface)] p-6">
    <Status v-for="each in statuses" :key="each" :status="each" />
    <Status id="live" :status="status" :label="label" :motion="motion" />
    <Status id="composed" status="complete">
      <StatusLabel v-slot="{ state }">{{ `Build ${state.label.toLowerCase()}` }}</StatusLabel>
      <StatusIcon />
    </Status>
  </div>
</template>
