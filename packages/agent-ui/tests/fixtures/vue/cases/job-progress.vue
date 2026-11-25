<script lang="ts">
export const variants = ["all", "reduced", "clock"] as const;
</script>

<script setup lang="ts">
import type { JobProgressOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { JobProgress } from "../../../../src/vue/job-progress.js";
import { expose } from "../../shared/expose.js";
import { clockJob, type JobFixture, type JobHost, type JobId, jobHost, jobs, LOG } from "../../shared/job-progress.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, call } = jobHost();
const onCancel = call("cancel");
const onRetry = call("retry");
const motion = props.variant === "reduced" ? "reduced" : undefined;
const clock = clockJob();
const log = LOG.join("\n");

const patches = shallowRef<Partial<Record<JobId, Partial<JobProgressOptions>>>>({});
const flush = useFlush();
const optionsOf = (job: JobFixture): JobProgressOptions => ({ ...job.options, ...patches.value[job.id] });

onMounted(() => {
  // Each call renders before it returns, so two calls in a row aren't batched into the second.
  const set: JobHost["set"] = (id, options) =>
    flush(() => {
      patches.value = { ...patches.value, [id]: { ...patches.value[id], ...options } };
    });
  expose({ kindHost: Object.assign(host, { set }) });
});
</script>

<template>
  <div v-if="variant === 'clock'" class="w-[30rem] p-6">
    <JobProgress id="clock" v-bind="clock" />
  </div>
  <div v-else class="flex w-[30rem] flex-col gap-4 p-6">
    <JobProgress
      v-for="job in jobs"
      :id="job.id"
      :key="job.id"
      v-bind="optionsOf(job)"
      :motion="motion"
      :on-cancel="job.cancel ? onCancel : undefined"
      :on-retry="job.retry ? onRetry : undefined"
    >
      <pre v-if="job.log">{{ log }}</pre>
    </JobProgress>
  </div>
</template>
