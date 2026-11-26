<script setup lang="ts">
import type { Schedule } from "@kind-ui/agent-ui";
import { shallowRef } from "vue";
import { ScheduleCard } from "@/components/ui/vue/schedule-card";

const inTwentyMinutes = () => new Date(Date.now() + 20 * 60_000).toISOString();

const schedule = shallowRef<Schedule>({
  id: "triage",
  label: "Daily triage",
  description: "Weekdays at 9:00, new issues in kind-ui/agent-ui",
  enabled: true,
  nextRunAt: inTwentyMinutes(),
  lastRun: { at: new Date(Date.now() - 86_400_000).toISOString(), status: "complete", href: "#" },
});

const onEnabledChange = (enabled: boolean) => {
  schedule.value = { ...schedule.value, enabled };
};

const runNow = () =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      schedule.value = {
        ...schedule.value,
        lastRun: { at: new Date().toISOString(), status: "running", href: "#" },
      };
      resolve();
    }, 800);
  });

const edit = () => {};
</script>

<template>
  <ScheduleCard
    class="w-full max-w-md"
    :schedule="schedule"
    :on-run-now="runNow"
    :on-edit="edit"
    @enabled-change="onEnabledChange"
  />
</template>
