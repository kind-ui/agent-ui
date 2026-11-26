<script lang="ts">
export const variants = [
  "all",
  "soon",
  "paused",
  "unsafe",
  "new",
  "refusing",
  "unconfirmed",
  "bare",
] as const;
</script>

<script setup lang="ts">
import type { Schedule } from "@kind-ui/agent-ui";
import type { ScheduleEnabledChangeReason } from "@kind-ui/agent-ui/core";
import type { ChangeDetails } from "@ui-sdk/core";
import { onMounted, shallowRef } from "vue";
import { ScheduleCard } from "../../../../src/vue/schedule-card.js";
import { expose } from "../../shared/expose.js";
import { scheduleCardHost, schedules } from "../../shared/schedule-card.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record, runNow } = scheduleCardHost();
const refusing = props.variant === "refusing";
const agentConfirm = props.variant === "unconfirmed" ? false : undefined;
const actions = props.variant !== "bare";

const schedule = shallowRef<Schedule | undefined>(schedules[props.variant] ?? schedules.all);

function onEnabledChange(enabled: boolean, details: ChangeDetails<ScheduleEnabledChangeReason>) {
  record("enabled", details, enabled);
  if (!refusing && schedule.value) schedule.value = { ...schedule.value, enabled };
}
const onEdit = (id: string, details: { reason: string; source?: string }) => record("edit", details, id);

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div class="max-w-[28rem] p-6">
    <ScheduleCard
      id="schedule"
      :schedule="schedule"
      time-zone="UTC"
      :agent-confirm="agentConfirm"
      :on-run-now="actions ? runNow : undefined"
      :on-edit="actions ? onEdit : undefined"
      @enabled-change="onEnabledChange"
    />
  </div>
</template>
