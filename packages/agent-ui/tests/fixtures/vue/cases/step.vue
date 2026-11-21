<script lang="ts">
export const variants = ["list", "reduced", "none"] as const;
</script>

<script setup lang="ts">
import type { StepStatus } from "@kind-ui/agent-ui";
import { onMounted, shallowRef } from "vue";
import {
  Step,
  StepChildren,
  StepContent,
  StepIcon,
  StepList,
  StepListItem,
  StepMeta,
  StepTitle,
  StepTrigger,
} from "../../../../src/vue/step.js";
import { expose } from "../../shared/expose.js";

defineProps<{ variant: string; params: URLSearchParams }>();

type Row = { id: string; title: string; status: StepStatus; meta?: string; body: string; duration?: number };

const rows = shallowRef<Row[]>([
  {
    id: "plan",
    title: "Plan the answer",
    status: "complete",
    meta: "2s",
    body: "Split the question into three lookups.",
  },
  {
    id: "search",
    title: "Search the web",
    status: "running",
    meta: "3s",
    duration: 3,
    body: "Querying three sources for recent releases.",
  },
  { id: "approve", title: "Run deploy script", status: "awaiting-input", body: "Waiting for approval." },
  { id: "fetch", title: "Fetch changelog", status: "error", meta: "1s", body: "Request failed with 503." },
  { id: "draft", title: "Draft the summary", status: "pending", body: "Collapsed text: kumquat." },
  { id: "old", title: "Old attempt", status: "cancelled", body: "Stopped by the user." },
]);
const status = shallowRef<StepStatus>("pending");

onMounted(() =>
  expose({
    kindSteps: {
      setStatus: (id: string, next: StepStatus) => {
        rows.value = rows.value.map((row) => (row.id === id ? { ...row, status: next } : row));
      },
      remove: (id: string) => {
        rows.value = rows.value.filter((row) => row.id !== id);
      },
    },
    kindStep: {
      setStatus: (next: StepStatus) => {
        status.value = next;
      },
    },
  }),
);
</script>

<template>
  <StepList v-if="variant === 'list'" aria-label="Agent steps" class="w-96 p-4">
    <Step v-for="row in rows" :key="row.id" :status="row.status" :duration-seconds="row.duration" kind="tool">
      <StepListItem :value="row.id">
        <template #render="{ props, children }">
          <StepTrigger v-bind="props"><component :is="children" /></StepTrigger>
        </template>
        <StepIcon />
        <StepTitle>{{ row.title }}</StepTitle>
        <StepMeta v-if="row.meta">{{ row.meta }}</StepMeta>
      </StepListItem>
      <StepContent>
        <p>{{ row.body }}</p>
      </StepContent>
      <StepChildren />
    </Step>
  </StepList>
  <Step v-else :motion="variant === 'reduced' ? 'reduced' : 'none'" :status="status">
    <StepTrigger>
      <StepIcon />
      <StepTitle>{{ variant === "reduced" ? "Reduced" : "Instant" }}</StepTitle>
    </StepTrigger>
    <StepContent>
      <p>Step details.</p>
    </StepContent>
  </Step>
</template>
